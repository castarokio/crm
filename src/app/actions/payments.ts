'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession, requireCallerSession } from '@/lib/auth-session';
import { broadcastSse } from '@/lib/sse-broker';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

export async function createPaymentRecord(payload: {
  dealId: number;
  amountExpected: number;
  paymentType: string;
  paymentMethod: string;
  proofUrl?: string;
}) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        deal_id: payload.dealId,
        amount_expected: payload.amountExpected,
        payment_type: payload.paymentType,
        payment_method: payload.paymentMethod,
        proof_url: payload.proofUrl || null,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Log to audit logs
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'CREATE_PAYMENT_RECORD',
      details: `Expected payment of ${payload.amountExpected} DZD created for deal ID ${payload.dealId}.`,
      lead_id: null
    });

    return { success: true, payment: data };
  } catch (error: any) {
    console.error('[createPaymentRecord]', error.message);
    return { success: false, error: error.message };
  }
}

export async function confirmPaymentStatus(paymentId: number, amountReceived: number) {
  try {
    const session = await requireAdminSession(); // Admins and Managers
    const supabase = requireSupabase();
    const nowStr = new Date().toISOString();

    // 1. Update Payment Status to Confirmed
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        amount_received: amountReceived,
        status: 'Confirmed',
        confirmed_by: session.name,
        paid_at: nowStr
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Log to audit logs
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'CONFIRM_PAYMENT',
      details: `Payment of ${amountReceived} DZD confirmed by ${session.name}.`,
      lead_id: null
    });

    // 2. Query deal details to find owner and commission rate
    const { data: deal } = await supabase
      .from('deals')
      .select('owner_caller_id, commission_rate')
      .eq('id', payment.deal_id)
      .single();

    if (deal && deal.owner_caller_id) {
      // Calculate commission amount: payment amount * commission_rate / 100
      const commissionAmt = (amountReceived * (deal.commission_rate || 20.00)) / 100.00;

      await supabase.from('commissions').insert({
        caller_id: deal.owner_caller_id,
        deal_id: payment.deal_id,
        payment_id: payment.id,
        commission_rate: deal.commission_rate || 20.00,
        payment_amount: amountReceived,
        commission_amount: commissionAmt,
        status: 'Pending Approval'
      });

      // Log commission calculation in audit logs
      await supabase.from('audit_logs').insert({
        caller_name: 'SYSTEM',
        action_type: 'CALCULATE_COMMISSION',
        details: `Commission of ${commissionAmt} DZD calculated for ${deal.owner_caller_id} (Rate: ${deal.commission_rate}%).`,
        lead_id: null
      });
    }

    // 3. Promote deal stages automatically
    if (payment.payment_type === 'deposit') {
      await supabase
        .from('deals')
        .update({ 
          stage: 'Deposit Paid', 
          payment_status: 'Deposit Paid',
          updated_at: nowStr
        })
        .eq('id', payment.deal_id);
      
      // Auto-create Project Record
      await createProjectForDeal(payment.deal_id);
    } else if (payment.payment_type === 'final') {
      await supabase
        .from('deals')
        .update({ 
          stage: 'Closed Won', 
          payment_status: 'Fully Paid',
          updated_at: nowStr
        })
        .eq('id', payment.deal_id);
    }

    // Broadcast SSE to trigger pipeline state updates
    broadcastSse('STATUS_CHANGED', { leadId: payment.deal_id, status: payment.payment_type === 'deposit' ? 'Deposit Paid' : 'Closed Won', user: 'system' });

    return { success: true, payment };
  } catch (error: any) {
    console.error('[confirmPaymentStatus]', error.message);
    return { success: false, error: error.message };
  }
}

async function createProjectForDeal(dealId: number) {
  try {
    const supabase = requireSupabase();
    // Verify if project already exists for this deal
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('deal_id', dealId)
      .maybeSingle();

    if (existingProject) return;

    // Fetch deal package type
    const { data: deal } = await supabase
      .from('deals')
      .select('package_type')
      .eq('id', dealId)
      .single();

    await supabase.from('projects').insert({
      deal_id: dealId,
      package_type: deal?.package_type || 'Starter',
      client_content_status: {
        logo: false,
        agency_name: true,
        phone: true,
        email: false,
        social_links: false,
        images: false
      },
      current_stage: 'Deposit Paid'
    });
  } catch (err: any) {
    console.error('[createProjectForDeal] failed:', err.message);
  }
}
