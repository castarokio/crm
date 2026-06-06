'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireCallerSession, requireRole } from '@/lib/auth-session';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

export async function getDisputesAction() {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    let query = supabase.from('disputes').select(`
      *,
      leads (
        agency_name,
        phone,
        status
      ),
      deals (
        deal_name,
        package_type,
        stage
      ),
      commissions (
        commission_amount,
        status
      )
    `);

    // Gating access depending on role
    const unrestrictedRoles = ['Admin', 'Manager', 'Supervisor', 'Auditor', 'Viewer'];
    if (!unrestrictedRoles.includes(session.role)) {
      query = query.eq('opened_by', session.name);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return { success: true, disputes: data || [] };
  } catch (error: any) {
    console.error('[getDisputesAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function fileDisputeAction(payload: {
  disputeType: string;
  leadId?: number;
  dealId?: number;
  commissionId?: number;
  explanation: string;
  proofUrl?: string;
}) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        opened_by: session.name,
        dispute_type: payload.disputeType,
        lead_id: payload.leadId || null,
        deal_id: payload.dealId || null,
        commission_id: payload.commissionId || null,
        explanation: payload.explanation,
        proof_url: payload.proofUrl || null,
        status: 'Open'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If commissionId is provided, also set its status to 'Disputed'
    if (payload.commissionId) {
      await supabase
        .from('commissions')
        .update({ status: 'Disputed', dispute_id: data.id })
        .eq('id', payload.commissionId);
    }

    // Audit Log
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'FILE_DISPUTE',
      details: `Dispute of type "${payload.disputeType}" opened by ${session.name}. Reason: ${payload.explanation.substring(0, 60)}...`,
      lead_id: payload.leadId || null
    });

    return { success: true, dispute: data };
  } catch (error: any) {
    console.error('[fileDisputeAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function resolveDisputeAction(disputeId: number, decision: string, status: string) {
  try {
    const session = await requireRole(['Admin', 'Manager']);
    const supabase = requireSupabase();
    const nowStr = new Date().toISOString();

    const { data: dispute, error: fetchError } = await supabase
      .from('disputes')
      .select('commission_id')
      .eq('id', disputeId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const { data, error } = await supabase
      .from('disputes')
      .update({
        status: status, // 'Accepted', 'Rejected', 'Split Decision', 'Resolved'
        decision: decision,
        decided_by: session.name,
        decided_at: nowStr
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If the dispute was tied to a commission, update the commission status accordingly
    if (dispute?.commission_id) {
      let nextCommStatus = 'Pending Approval';
      if (status === 'Accepted') nextCommStatus = 'Approved';
      else if (status === 'Rejected') nextCommStatus = 'Pending Approval'; // Back to standard flow
      else if (status === 'Resolved' || status === 'Split Decision') nextCommStatus = 'Approved';

      await supabase
        .from('commissions')
        .update({ status: nextCommStatus })
        .eq('id', dispute.commission_id);
    }

    // Audit Log
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'RESOLVE_DISPUTE',
      details: `Dispute ID ${disputeId} resolved as "${status}" by ${session.name}. Decision: ${decision}`,
      lead_id: null
    });

    return { success: true, dispute: data };
  } catch (error: any) {
    console.error('[resolveDisputeAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getLeadsForDisputeAction() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();

    const { data, error } = await supabase
      .from('leads')
      .select('id, agency_name')
      .order('agency_name', { ascending: true })
      .limit(100);

    if (error) throw new Error(error.message);
    return { success: true, leads: data || [] };
  } catch (error: any) {
    console.error('[getLeadsForDisputeAction]', error.message);
    return { success: false, error: error.message, leads: [] };
  }
}

