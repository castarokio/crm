'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  requireCallerSession,
  requireWritableSession,
  requireRole,
} from '@/lib/auth-session';
import { ALLOWED_DEAL_STAGES } from '@/lib/constants';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

function assertAllowedDealStage(stage: string) {
  if (!(ALLOWED_DEAL_STAGES as readonly string[]).includes(stage)) {
    throw new Error('INVALID_DEAL_STAGE');
  }
}

export async function getDeals() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { success: true, deals: data || [] };
  } catch (error: any) {
    console.error('[getDeals]', error.message);
    return { success: false, error: error.message, deals: [] };
  }
}

export async function createDeal(params: {
  deal_name: string;
  company_name?: string;
  caller_name: string;
  lead_id?: number;
  setup_value?: number;
  recurring_value?: number;
  expected_close_date?: string;
  notes?: string;
}) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('deals')
      .insert([{
        deal_name: params.deal_name,
        company_name: params.company_name || '',
        caller_name: session.name,
        lead_id: params.lead_id || null,
        stage: 'New',
        setup_value: params.setup_value || 0,
        recurring_value: params.recurring_value || 0,
        expected_close_date: params.expected_close_date || null,
        notes: params.notes || '',
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { success: true, deal: data };
  } catch (error: any) {
    console.error('[createDeal]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateDealStage(dealId: number, newStage: string, callerName: string, lostReason?: string) {
  try {
    const session = await requireWritableSession();
    assertAllowedDealStage(newStage);
    const supabase = requireSupabase();
    
    const payload: Record<string, any> = {
      stage: newStage,
      updated_at: new Date().toISOString()
    };
    if (lostReason) payload.lost_reason = lostReason;

    const { error } = await supabase.from('deals').update(payload).eq('id', dealId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('[updateDealStage]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateDeal(dealId: number, callerName: string, fields: {
  deal_name?: string;
  company_name?: string;
  setup_value?: number;
  recurring_value?: number;
  expected_close_date?: string;
  notes?: string;
  lost_reason?: string;
}) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('deals')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', dealId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('[updateDeal]', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteDeal(dealId: number, callerName: string) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    const { error } = await supabase.from('deals').delete().eq('id', dealId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('[deleteDeal]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getCallerTarget(callerName: string) {
  try {
    const session = await requireCallerSession();
    const effectiveCallerName = session.role === 'Admin' || session.role === 'Supervisor' ? callerName : session.name;
    const supabase = requireSupabase();
    
    const { data, error } = await supabase
      .from('caller_profiles')
      .select('daily_call_target, weekly_appointment_target')
      .eq('name', effectiveCallerName)
      .single();
    if (error) throw new Error(error.message);

    // Count calls made today by this caller from the history ledger
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await supabase
      .from('call_history')
      .select('id', { count: 'exact', head: true })
      .eq('caller_name', effectiveCallerName)
      .gte('created_at', startOfToday.toISOString());
    if (countErr) throw new Error(countErr.message);

    // Count appointments logged this week (since Monday 00:00:00)
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const { count: apptCount, error: apptErr } = await supabase
      .from('call_history')
      .select('id', { count: 'exact', head: true })
      .eq('caller_name', effectiveCallerName)
      .gte('created_at', startOfWeek.toISOString())
      .in('call_status', ['Callback', 'Accepted', 'Client Configured', 'Interested']);
    if (apptErr) throw new Error(apptErr.message);

    return {
      success: true,
      daily_call_target: data?.daily_call_target ?? 80,
      weekly_appointment_target: data?.weekly_appointment_target ?? 15,
      calls_today: count ?? 0,
      appointments_this_week: apptCount ?? 0,
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message, 
      daily_call_target: 80, 
      weekly_appointment_target: 15, 
      calls_today: 0,
      appointments_this_week: 0 
    };
  }
}
