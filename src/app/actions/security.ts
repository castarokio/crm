'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireCallerSession } from '@/lib/auth-session';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

export async function verifyDailyViewLimits(callerName: string, trustLevel: string, callerRole?: string) {
  try {
    const supabase = requireSupabase();
    
    // Bypass limit checks for Admin, Manager, and Supervisor roles
    const unrestrictedRoles = ['Admin', 'Manager', 'Supervisor'];
    if (callerRole && unrestrictedRoles.includes(callerRole)) {
      return { allowed: true, currentCount: 0, limit: 999999 };
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfDay = `${today}T00:00:00.000Z`;

    // Count lead view actions today
    const { count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('caller_name', callerName)
      .eq('action_type', 'VIEW_LEAD_DETAILS')
      .gte('created_at', startOfDay);

    if (error) throw new Error(error.message);

    const currentCount = count || 0;
    let limit = 50; // Default for 'New'
    
    if (trustLevel === 'Normal') {
      limit = 80;
    } else if (trustLevel === 'Trusted') {
      limit = 120;
    } else if (trustLevel === 'Senior') {
      limit = 999999; // Virtually unlimited
    }

    if (currentCount >= limit) {
      // Log suspicious activity
      await supabase.from('audit_logs').insert({
        caller_name: callerName,
        action_type: 'DAILY_LIMIT_EXCEEDED',
        details: `Caller viewed ${currentCount} leads today. Daily limit: ${limit}. Action blocked.`,
        lead_id: null
      });
      return { allowed: false, currentCount, limit };
    }

    return { allowed: true, currentCount, limit };
  } catch (error: any) {
    console.error('[verifyDailyViewLimits]', error.message);
    return { allowed: false, currentCount: 0, limit: 0, error: error.message };
  }
}

export async function logLeadViewAction(leadId: number) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    // 1. Verify limit first
    const limitCheck = await verifyDailyViewLimits(session.name, session.trust_level || 'New', session.role);
    if (!limitCheck.allowed) {
      return { success: false, error: 'DAILY_VIEW_LIMIT_EXCEEDED', limit: limitCheck.limit };
    }

    // 2. Insert audit log for lead view
    const { error } = await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'VIEW_LEAD_DETAILS',
      details: `Lead details loaded by ${session.name} (Daily views: ${limitCheck.currentCount + 1}/${limitCheck.limit === 999999 ? 'unlimited' : limitCheck.limit})`,
      lead_id: leadId
    });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: any) {
    console.error('[logLeadViewAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function logClipboardAction(payload: { leadId: number; channel: string; targetValue: string }) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    // Log the copy event
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: `CLIPBOARD_COPY`,
      details: `Copied ${payload.channel} value: "${payload.targetValue.substring(0, 5)}***" on active lead card.`,
      lead_id: payload.leadId
    });

    // Check if the lead copied is in the trap_leads registry
    const { data: trap, error } = await supabase
      .from('trap_leads')
      .select('id, trigger_count, notes')
      .eq('lead_id', payload.leadId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (trap) {
      const nowStr = new Date().toISOString();
      const updatedNotes = (trap.notes || '') + `\n[Triggered via copy on ${payload.channel} at ${nowStr} by ${session.name}]`;

      // Mark the canary trap as triggered
      await supabase
        .from('trap_leads')
        .update({
          triggered: true,
          triggered_by: session.name,
          triggered_at: nowStr,
          notes: updatedNotes.trim()
        })
        .eq('id', trap.id);

      // Log a CRITICAL security event in audit logs
      await supabase.from('audit_logs').insert({
        caller_name: session.name,
        action_type: 'TRAP_LEAD_TRIGGERED',
        details: `CANARY TRAP ENGAGED. Caller ${session.name} copied sensitive trap data via ${payload.channel}.`,
        lead_id: payload.leadId
      });

      return { success: true, trapTriggered: true };
    }

    return { success: true, trapTriggered: false };
  } catch (error: any) {
    console.error('[logClipboardAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function sweepExpiredLocksAction() {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();
    const nowStr = new Date().toISOString();

    // 1. Sweep expired active locks
    const { data: expiredActive, error: activeErr } = await supabase
      .from('lead_locks')
      .update({ status: 'Expired' })
      .eq('lock_type', 'active_call')
      .eq('status', 'Active')
      .lt('lock_expiry', nowStr)
      .select('id');

    if (activeErr) throw new Error(activeErr.message);

    // 2. Sweep expired ownership locks (60 days expiry check)
    const { data: expiredOwnership, error: ownerErr } = await supabase
      .from('lead_locks')
      .update({ status: 'Expired' })
      .eq('lock_type', 'ownership')
      .eq('status', 'Active')
      .lt('lock_expiry', nowStr)
      .select('id, lead_id');

    if (ownerErr) throw new Error(ownerErr.message);

    // Release lead owner_caller_id for 60-day expired ones
    if (expiredOwnership && expiredOwnership.length > 0) {
      const expiredLeadIds = expiredOwnership.map((o: any) => o.lead_id);
      await supabase
        .from('leads')
        .update({ owner_caller_id: null, ownership_status: 'Expired' })
        .in('id', expiredLeadIds);
    }

    // 3. Sweep inactive ownership locks (14 days check)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch all active ownership locks to check their lead's call history
    const { data: activeOwners } = await supabase
      .from('lead_locks')
      .select('id, lead_id, locked_by')
      .eq('lock_type', 'ownership')
      .eq('status', 'Active');

    let inactiveCount = 0;
    if (activeOwners && activeOwners.length > 0) {
      for (const owner of activeOwners) {
        const { data: calls } = await supabase
          .from('call_history')
          .select('id')
          .eq('lead_id', owner.lead_id)
          .gt('created_at', fourteenDaysAgo)
          .limit(1);

        if (!calls || calls.length === 0) {
          // No calls in the last 14 days, expire it!
          await supabase.from('lead_locks').update({ status: 'Expired' }).eq('id', owner.id);
          await supabase
            .from('leads')
            .update({ owner_caller_id: null, ownership_status: 'Expired' })
            .eq('id', owner.lead_id);
          
          inactiveCount += 1;

          // Log in audits
          await supabase.from('audit_logs').insert({
            caller_name: 'SYSTEM_SWEEPER',
            action_type: 'OWNERSHIP_EXPIRED_INACTIVITY',
            details: `Ownership lock of ${owner.locked_by} expired due to 14 days inactivity.`,
            lead_id: owner.lead_id
          });
        }
      }
    }

    const sweptActiveCount = expiredActive?.length || 0;
    const swept60DayCount = expiredOwnership?.length || 0;

    if (sweptActiveCount > 0 || swept60DayCount > 0 || inactiveCount > 0) {
      await supabase.from('audit_logs').insert({
        caller_name: session.name,
        action_type: 'EXECUTE_LOCK_SWEEP',
        details: `Locks sweeper swept ${sweptActiveCount} active locks, ${swept60DayCount} 60-day leases, and ${inactiveCount} inactive 14-day leases.`,
        lead_id: null
      });
    }

    return {
      success: true,
      sweptActive: sweptActiveCount,
      swept60Day: swept60DayCount,
      swept14Day: inactiveCount
    };
  } catch (error: any) {
    console.error('[sweepExpiredLocksAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function logExportAction(leadCount: number) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();

    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: 'EXPORT_LEADS',
      details: `User exported ${leadCount} leads to CSV file.`,
      lead_id: null
    });

    return { success: true };
  } catch (error: any) {
    console.error('[logExportAction]', error.message);
    return { success: false, error: error.message };
  }
}
