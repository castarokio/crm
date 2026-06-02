'use server';

import { getSupabase } from '@/lib/supabase';

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

const CONVERTED_STATUSES = ['Accepted', 'Client Configured'];
const WARM_STATUSES = ['Interested'];
const FOLLOWUP_STATUSES = ['Callback', 'Busy', 'No Answer'];
const ACTIVE_ASSIGNMENT_FILTER = 'call_status.is.null,call_status.eq.Not Called';

// ── 1. Get Leads ──────────────────────────────────────────────────────────────
export async function getLeads(options: {
  search?: string;
  status?: string;
  priority?: string;
  area?: string;
  page?: number;
  limit?: number;
  excludeLost?: boolean;
}) {
  const { search = '', status = '', priority = '', area = '', page = 1, limit = 20, excludeLost = false } = options;
  const offset = (page - 1) * limit;

  try {
    const supabase = requireSupabase();
    let q = supabase.from('leads').select('*', { count: 'exact' });

    if (search) {
      q = q.or(`agency_name.ilike.%${search}%,phone.ilike.%${search}%,area.ilike.%${search}%,website.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }
    if (status === 'Followups') {
      q = q.in('call_status', FOLLOWUP_STATUSES);
    } else if (status === 'No Answer / Busy') {
      q = q.in('call_status', ['Busy', 'No Answer']);
    } else if (status === 'WarmLeads') {
      q = q.in('call_status', WARM_STATUSES);
    } else if (status === 'GoodClients') {
      q = q.in('call_status', CONVERTED_STATUSES);
    } else if (status) {
      q = q.eq('call_status', status);
    } else if (excludeLost) {
      q = q.or(ACTIVE_ASSIGNMENT_FILTER);
    }
    if (priority) q = q.eq('priority', parseInt(priority, 10));
    if (area) q = q.ilike('area', `%${area}%`);

    const { data, count, error } = await q
      .order('priority', { ascending: true })
      .order('review_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return { success: true, leads: data || [], total: count || 0 };
  } catch (error: any) {
    console.error('[getLeads]', error.message);
    return { success: false, error: error.message, leads: [], total: 0 };
  }
}

// ── 2. Dialer Queue ───────────────────────────────────────────────────────────
export async function getDialerQueue(callerName?: string) {
  try {
    const supabase = requireSupabase();
    let q = supabase
      .from('leads')
      .select('*')
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (callerName) {
      q = q.or(`assigned_to.eq.${callerName},and(assigned_to.is.null,or(caller_name.is.null,caller_name.eq.${callerName}))`);
    }

    const { data, error } = await q
      .order('priority', { ascending: true })
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .order('review_count', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return { success: true, queue: data || [] };
  } catch (error: any) {
    console.error('[getDialerQueue]', error.message);
    return { success: false, error: error.message, queue: [] };
  }
}

// ── 3. Update Call Status ─────────────────────────────────────────────────────
export async function updateCallStatus(id: number, status: string, notes: string, callNotes: string, callerName: string) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('leads').update({
      call_status: status,
      notes,
      call_notes: callNotes,
      caller_name: callerName,
      assigned_to: callerName, // Lock lead to this caller upon contact
      last_called_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);

    // Fire-and-forget log call history (safely ignores error if table not created yet)
    supabase.from('call_history').insert({
      lead_id: id,
      caller_name: callerName,
      call_status: status,
      notes: callNotes || notes
    }).then(({ error: histErr }: any) => {
      if (histErr) console.warn('[call_history log warning]', histErr.message);
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 4. Update Lead Details ────────────────────────────────────────────────────
export async function updateLeadDetails(id: number, fields: {
  agency_name?: string; phone?: string; phone_2?: string; email?: string; email_2?: string; website?: string;
  facebook?: string; instagram?: string; tiktok?: string; linkedin?: string; social_link?: string;
  priority?: number; area?: string; notes?: string; contact_person?: string; meeting_date?: string;
}) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('leads').update({
      ...fields,
      last_updated: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 5. Analytics ──────────────────────────────────────────────────────────────
export async function getAnalytics() {
  try {
    const supabase = requireSupabase();
    const [
      totalRes,
      todayRes,
      interestedRes,
      acceptedRes,
      configuredRes,
      callbackRes,
      notInterestedRes,
      wrongNumberRes,
      noAnswerRes,
      busyRes
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true })
        .gte('last_called_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Interested'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Accepted'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Client Configured'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Callback'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Not Interested'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Wrong Number'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'No Answer'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('call_status', 'Busy'),
    ]);

    const totalLeads = totalRes.count || 0;
    const interested = interestedRes.count || 0;
    const converted = (acceptedRes.count || 0) + (configuredRes.count || 0);
    const callback = callbackRes.count || 0;
    const notInterested = notInterestedRes.count || 0;
    const wrongNumber = wrongNumberRes.count || 0;
    const noAnswer = (noAnswerRes.count || 0) + (busyRes.count || 0);

    const totalCalled = interested + converted + callback + notInterested + wrongNumber + noAnswer;

    return {
      success: true,
      stats: {
        totalLeads,
        totalCalled,
        callsToday: todayRes.count || 0,
        statuses: {
          notCalled: totalLeads - totalCalled,
          interested,
          converted,
          notInterested,
          callback,
          noAnswer,
          wrongNumber,
        },
        priorities: {},
        areas: [],
      },
    };
  } catch (error: any) {
    console.error('[getAnalytics]', error.message);
    return { success: false, error: error.message, stats: null };
  }
}

// ── 6. AI Post-Call Parser ────────────────────────────────────────────────────
export async function processCallSummaryWithAI(rawText: string) {
  const apiKey = process.env.GLM_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GLM_API_KEY_MISSING', extractedData: { call_status: 'Callback', meeting_date: null, contact_person: null, updated_email: null, summary: rawText } };
  }

  const prompt = `You are an intelligent data entry assistant for a cold-calling team (Hamid, Oussama, Kamel).
Analyze this raw call note from an Algerian travel agency call and extract structured data.

Call status options:
- "Interested": Spoke to decision-maker and they are warm, but no firm next step is accepted yet.
- "Accepted": They agreed to a meeting, audit, demo, or next business step.
- "Callback": Busy, asked to call back, or requested more info.
- "Not Interested": Direct refusal or said no.
- "Wrong Number": Invalid or disconnected number.
- "No Answer": Voicemail or rang with no answer.

Raw note: """${rawText}"""

Respond ONLY with a valid JSON object:
{
  "call_status": "Interested" | "Accepted" | "Callback" | "Not Interested" | "Wrong Number" | "No Answer",
  "meeting_date": "scheduled date/time string" or null,
  "contact_person": "name of contact" or null,
  "updated_email": "email address if mentioned" or null,
  "summary": "clean 1-sentence English summary"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 250, responseMimeType: 'application/json' } }) }
    );
    if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: true, extractedData: JSON.parse(textResult.trim()) };
  } catch (error: any) {
    return { success: false, error: error.message, extractedData: { call_status: 'Callback', meeting_date: null, contact_person: null, updated_email: null, summary: 'Error: ' + rawText } };
  }
}

// ── 7. AI Update + Save ───────────────────────────────────────────────────────
export async function updateCallStatusWithAI(leadId: number, callerName: string, rawSummary: string) {
  const aiRes = await processCallSummaryWithAI(rawSummary);
  const data = aiRes.extractedData;

  try {
    const supabase = requireSupabase();
    const updatePayload: any = {
      call_status: data.call_status,
      call_notes: data.summary,
      caller_name: callerName,
      meeting_date: data.meeting_date,
      contact_person: data.contact_person,
      last_called_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      assigned_to: callerName,
    };
    if (data.updated_email) updatePayload.email = data.updated_email;
    const { error } = await supabase.from('leads').update(updatePayload).eq('id', leadId);
    if (error) throw new Error(error.message);

    // Fire-and-forget log call history
    supabase.from('call_history').insert({
      lead_id: leadId,
      caller_name: callerName,
      call_status: data.call_status,
      notes: data.summary || rawSummary
    }).then(({ error: histErr }: any) => {
      if (histErr) console.warn('[call_history log warning]', histErr.message);
    });

    return { success: true, extracted: data };
  } catch (error: any) {
    console.error('[updateCallStatusWithAI]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 8. Team Leaderboard ───────────────────────────────────────────────────────
export async function getTeamLeaderboard() {
  const callers = ['Hamid', 'Oussama', 'Kamel'];
  try {
    const supabase = requireSupabase();
    const promises = callers.map(async (name) => {
      const [totalRes, warmRes, lostRes] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('caller_name', name),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('caller_name', name).in('call_status', ['Interested', 'Accepted', 'Client Configured']),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('caller_name', name).in('call_status', ['Not Interested', 'Wrong Number']),
      ]);
      const total = totalRes.count || 0;
      const warm = warmRes.count || 0;
      const lost = lostRes.count || 0;
      return {
        name,
        total_calls: total,
        warm_deals: warm,
        lost_deals: lost,
        success_rate: total > 0 ? parseFloat(((warm / total) * 100).toFixed(1)) : 0.0,
      };
    });

    const leaderboard = await Promise.all(promises);
    leaderboard.sort((a, b) => b.warm_deals - a.warm_deals || b.total_calls - a.total_calls);
    return { success: true, leaderboard };
  } catch (error: any) {
    console.error('[getTeamLeaderboard]', error.message);
    return { success: false, error: error.message, leaderboard: [] };
  }
}

// ── 9. Meetings List ──────────────────────────────────────────────────────────
export async function getMeetingsList() {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('id, agency_name, phone, area, contact_person, meeting_date, caller_name, call_status')
      .not('meeting_date', 'is', null)
      .neq('meeting_date', '')
      .in('call_status', ['Interested', 'Accepted', 'Callback'])
      .order('last_called_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return { success: true, meetings: data || [] };
  } catch (error: any) {
    console.error('[getMeetingsList]', error.message);
    return { success: false, error: error.message, meetings: [] };
  }
}

// ── 10. Admin Lead Distribution ──────────────────────────────────────────────
export async function assignLeadsByRegion(caller: string, region: string) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: caller })
      .ilike('area', `%${region}%`)
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignLeadsByPriority(caller: string, priority: number) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: caller })
      .eq('priority', priority)
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clearAssignments() {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: null })
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function splitLeadsEqually() {
  try {
    const supabase = requireSupabase();
    const { data: leads, error: fetchErr } = await supabase
      .from('leads')
      .select('id')
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!leads || leads.length === 0) return { success: true, totalAssigned: 0 };

    const callers = ['Hamid', 'Oussama', 'Kamel'];
    const targetLeads = leads as Array<{ id: number }>;
    const totalLeads = targetLeads.length;
    
    const promises = callers.map(async (caller, idx) => {
      const ids = targetLeads
        .filter((_, i) => i % callers.length === idx)
        .map(x => x.id);

      if (ids.length === 0) return;

      return supabase
        .from('leads')
        .update({ assigned_to: caller })
        .in('id', ids);
    });

    await Promise.all(promises);
    return { success: true, totalAssigned: totalLeads };
  } catch (error: any) {
    console.error('[splitLeadsEqually]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 11. Call History Actions ──────────────────────────────────────────────────
export async function getCallHistory(leadId: number) {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('call_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, history: data || [] };
  } catch (error: any) {
    console.error('[getCallHistory]', error.message);
    return { success: false, error: error.message, history: [] };
  }
}

// ── 11b. Permanently Delete Bad Lead ─────────────────────────────────────────
export async function deleteLeadPermanently(leadId: number) {
  try {
    const supabase = requireSupabase();

    const { error: historyError } = await supabase
      .from('call_history')
      .delete()
      .eq('lead_id', leadId);
    if (historyError) throw new Error(historyError.message);

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: any) {
    console.error('[deleteLeadPermanently]', error.message);
    return { success: false, error: error.message };
  }
}

export async function restoreLeadToQueue(leadId: number) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({
        call_status: 'Not Called',
        call_notes: null,
        caller_name: null,
        assigned_to: null,
        meeting_date: null,
        last_called_at: null,
        last_updated: new Date().toISOString(),
      })
      .eq('id', leadId);
    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: any) {
    console.error('[restoreLeadToQueue]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 12. Get Assignment Stats ──────────────────────────────────────────────────
export async function getAssignmentStats() {
  try {
    const supabase = requireSupabase();
    const callers = ['Hamid', 'Oussama', 'Kamel'];
    const promises = callers.map(async (name) => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', name)
        .or(ACTIVE_ASSIGNMENT_FILTER);
      if (error) throw new Error(error.message);
      return { name, count: count || 0 };
    });

    const { count: unassignedCount, error: unassignedErr } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);
    if (unassignedErr) throw new Error(unassignedErr.message);

    const stats = await Promise.all(promises);
    return { success: true, stats, unassigned: unassignedCount || 0 };
  } catch (error: any) {
    console.error('[getAssignmentStats]', error.message);
    return { success: false, error: error.message, stats: [], unassigned: 0 };
  }
}

// ── 13. Admin Lead Range Assignment ──────────────────────────────────────────
export async function assignLeadsByRange(caller: string, startId: number, endId: number) {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: caller })
      .gte('id', startId)
      .lte('id', endId)
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

