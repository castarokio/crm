'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireCallerSession, requireRole } from '@/lib/auth-session';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

export async function getCommissionsAction() {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    let query = supabase.from('commissions').select(`
      *,
      deals (
        deal_name,
        package_type,
        stage
      )
    `);

    // If role is a standard Caller, Closer, or Developer, restrict to their own commissions.
    // Admins, Managers, Supervisors, Auditors, and Viewers can see all commissions.
    const unrestrictedRoles = ['Admin', 'Manager', 'Supervisor', 'Auditor', 'Viewer'];
    if (!unrestrictedRoles.includes(session.role)) {
      query = query.eq('caller_id', session.name);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return { success: true, commissions: data || [] };
  } catch (error: any) {
    console.error('[getCommissionsAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function approveCommissionAction(commissionId: number) {
  try {
    const session = await requireRole(['Admin', 'Manager']);
    const supabase = requireSupabase();

    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'Approved',
        approved_by: session.name
      })
      .eq('id', commissionId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Audit log
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'APPROVE_COMMISSION',
      details: `Commission ID ${commissionId} approved by ${session.name}.`,
      lead_id: null
    });

    return { success: true, commission: data };
  } catch (error: any) {
    console.error('[approveCommissionAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function payCommissionAction(commissionId: number, proofUrl?: string) {
  try {
    const session = await requireRole(['Admin', 'Manager']);
    const supabase = requireSupabase();
    const nowStr = new Date().toISOString();

    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'Paid',
        paid_by: session.name,
        paid_at: nowStr,
        proof_url: proofUrl || null
      })
      .eq('id', commissionId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Audit log
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'PAY_COMMISSION',
      details: `Commission ID ${commissionId} marked as Paid by ${session.name}. Proof URL: ${proofUrl || 'none'}`,
      lead_id: null
    });

    return { success: true, commission: data };
  } catch (error: any) {
    console.error('[payCommissionAction]', error.message);
    return { success: false, error: error.message };
  }
}
