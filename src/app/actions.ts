'use server';

import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import fs from 'fs';

// ── DB Client Setup ───────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (supabaseUrl && supabaseKey) {
    return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  }
  return null;
}

// SQLite fallback (local dev)
let _sqliteDb: sqlite3.Database | null = null;
function getSqlite(): sqlite3.Database | null {
  if (_sqliteDb) return _sqliteDb;
  const path = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
  if (fs.existsSync(path)) {
    _sqliteDb = new sqlite3.Database(path);
    return _sqliteDb;
  }
  return null;
}

function sqliteAll(db: sqlite3.Database, sql: string, params: any[]): Promise<any[]> {
  const q = sql.replace(/\$\d+/g, '?').replace(/ILIKE/g, 'LIKE')
    .replace(/CURRENT_TIMESTAMP/g, "datetime('now','localtime')")
    .replace(/CURRENT_DATE/g, "date('now','localtime')");
  return new Promise((res, rej) => db.all(q, params, (e, rows) => e ? rej(e) : res(rows || [])));
}

function sqliteRun(db: sqlite3.Database, sql: string, params: any[]): Promise<number> {
  const q = sql.replace(/\$\d+/g, '?').replace(/ILIKE/g, 'LIKE')
    .replace(/CURRENT_TIMESTAMP/g, "datetime('now','localtime')")
    .replace(/CURRENT_DATE/g, "date('now','localtime')");
  return new Promise((res, rej) => db.run(q, params, function(e) { e ? rej(e) : res(this.changes); }));
}

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

  const sb = getSupabase();
  if (sb) {
    try {
      let q = sb.from('leads').select('*', { count: 'exact' });

      if (search) {
        q = q.or(`agency_name.ilike.%${search}%,phone.ilike.%${search}%,area.ilike.%${search}%,website.ilike.%${search}%,contact_person.ilike.%${search}%`);
      }
      if (status) {
        q = q.eq('call_status', status);
      } else if (excludeLost) {
        q = q.not('call_status', 'in', '("Not Interested","Wrong Number")');
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
      return { success: false, error: error.message, leads: [], total: 0 };
    }
  }

  // SQLite fallback
  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED', leads: [], total: 0 };

  try {
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (search) { sql += ` AND (agency_name LIKE $${idx} OR phone LIKE $${idx} OR area LIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (status) { sql += ` AND call_status = $${idx}`; params.push(status); idx++; }
    else if (excludeLost) { sql += ` AND (call_status IS NULL OR call_status NOT IN ('Not Interested','Wrong Number'))`; }
    if (priority) { sql += ` AND priority = $${idx}`; params.push(parseInt(priority, 10)); idx++; }
    if (area) { sql += ` AND area LIKE $${idx}`; params.push(`%${area}%`); idx++; }

    const countRows = await sqliteAll(db, sql.replace('SELECT *', 'SELECT COUNT(*) as count'), params);
    const total = parseInt(countRows[0]?.count || '0', 10);

    sql += ` ORDER BY priority ASC, review_count DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);
    const rows = await sqliteAll(db, sql, params);
    return { success: true, leads: rows, total };
  } catch (error: any) {
    return { success: false, error: error.message, leads: [], total: 0 };
  }
}

// ── 2. Dialer Queue ───────────────────────────────────────────────────────────
export async function getDialerQueue() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('leads')
        .select('*')
        .not('call_status', 'in', '("Interested","Not Interested","Wrong Number")')
        .order('priority', { ascending: true })
        .order('review_count', { ascending: false })
        .limit(15);
      if (error) throw new Error(error.message);
      return { success: true, queue: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, queue: [] };
    }
  }

  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED', queue: [] };
  try {
    const rows = await sqliteAll(db, `SELECT * FROM leads WHERE call_status IS NULL OR call_status NOT IN ('Interested','Not Interested','Wrong Number') ORDER BY priority ASC, review_count DESC LIMIT 15`, []);
    return { success: true, queue: rows };
  } catch (error: any) {
    return { success: false, error: error.message, queue: [] };
  }
}

// ── 3. Update Call Status ─────────────────────────────────────────────────────
export async function updateCallStatus(id: number, status: string, notes: string, callNotes: string, callerName: string) {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('leads').update({
        call_status: status,
        notes,
        call_notes: callNotes,
        caller_name: callerName,
        last_called_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED' };
  try {
    await sqliteRun(db, `UPDATE leads SET call_status=$1, notes=$2, call_notes=$3, caller_name=$4, last_called_at=CURRENT_TIMESTAMP WHERE id=$5`, [status, notes, callNotes, callerName, id]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 4. Update Lead Details ────────────────────────────────────────────────────
export async function updateLeadDetails(id: number, fields: {
  agency_name?: string; phone?: string; email?: string; website?: string;
  facebook?: string; instagram?: string; tiktok?: string; linkedin?: string;
  priority?: number; area?: string; notes?: string; contact_person?: string; meeting_date?: string;
}) {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('leads').update({ ...fields, last_updated: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED' };
  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;
  Object.entries(fields).forEach(([k, v]) => { updates.push(`${k} = $${idx}`); params.push(v); idx++; });
  if (updates.length === 0) return { success: false, error: 'No fields' };
  params.push(id);
  try {
    await sqliteRun(db, `UPDATE leads SET ${updates.join(', ')}, last_updated=CURRENT_TIMESTAMP WHERE id=$${idx}`, params);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 5. Analytics ──────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { count: totalLeads } = await sb.from('leads').select('*', { count: 'exact', head: true });
      const { data: statusData } = await sb.from('leads').select('call_status');
      const { data: priorityData } = await sb.from('leads').select('priority');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: callsToday } = await sb.from('leads').select('*', { count: 'exact', head: true }).gte('last_called_at', today.toISOString());

      const statuses: Record<string, number> = {};
      (statusData || []).forEach((r: any) => { if (r.call_status) statuses[r.call_status] = (statuses[r.call_status] || 0) + 1; });
      const priorities: Record<string, number> = {};
      (priorityData || []).forEach((r: any) => { if (r.priority) priorities[`Priority ${r.priority}`] = (priorities[`Priority ${r.priority}`] || 0) + 1; });

      const totalCalled = Object.entries(statuses).filter(([s]) => s !== 'Not Called').reduce((sum, [, c]) => sum + c, 0);
      return {
        success: true,
        stats: {
          totalLeads: totalLeads || 0,
          totalCalled,
          callsToday: callsToday || 0,
          statuses: {
            notCalled: statuses['Not Called'] || ((totalLeads || 0) - totalCalled),
            interested: statuses['Interested'] || 0,
            notInterested: statuses['Not Interested'] || 0,
            callback: statuses['Callback'] || 0,
            noAnswer: (statuses['No Answer'] || 0) + (statuses['Busy'] || 0),
            wrongNumber: statuses['Wrong Number'] || 0,
          },
          priorities,
          areas: [],
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message, stats: null };
    }
  }

  return { success: false, error: 'DATABASE_NOT_CONFIGURED', stats: null };
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
- "Interested": Spoke to decision-maker, they want services or scheduled a meeting.
- "Callback": Busy, asked to call back, or requested more info.
- "Not Interested": Direct refusal or said no.
- "Wrong Number": Invalid or disconnected number.
- "No Answer": Voicemail or rang with no answer.

Raw note: """${rawText}"""

Respond ONLY with a valid JSON object:
{
  "call_status": "Interested" | "Callback" | "Not Interested" | "Wrong Number" | "No Answer",
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
  const sb = getSupabase();

  if (sb) {
    try {
      const updatePayload: any = {
        call_status: data.call_status,
        call_notes: data.summary,
        caller_name: callerName,
        meeting_date: data.meeting_date,
        contact_person: data.contact_person,
        last_called_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };
      if (data.updated_email) updatePayload.email = data.updated_email;
      const { error } = await sb.from('leads').update(updatePayload).eq('id', leadId);
      if (error) throw new Error(error.message);
      return { success: true, extracted: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED' };
  try {
    const params = data.updated_email
      ? [data.call_status, data.summary, callerName, data.meeting_date, data.contact_person, data.updated_email, leadId]
      : [data.call_status, data.summary, callerName, data.meeting_date, data.contact_person, leadId];
    const emailSet = data.updated_email ? ', email=$6' : '';
    const idIdx = data.updated_email ? '$7' : '$6';
    await sqliteRun(db, `UPDATE leads SET call_status=$1, call_notes=$2, caller_name=$3, meeting_date=$4, contact_person=$5${emailSet}, last_called_at=CURRENT_TIMESTAMP WHERE id=${idIdx}`, params);
    return { success: true, extracted: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 8. Team Leaderboard ───────────────────────────────────────────────────────
export async function getTeamLeaderboard() {
  const sb = getSupabase();
  const callers = ['Hamid', 'Oussama', 'Kamel'];

  if (sb) {
    try {
      const { data, error } = await sb.from('leads').select('caller_name, call_status').in('caller_name', callers);
      if (error) throw new Error(error.message);

      const leaderboard = callers.map(name => {
        const rows = (data || []).filter((r: any) => r.caller_name === name);
        const total = rows.length;
        const warm = rows.filter((r: any) => ['Interested', 'Callback'].includes(r.call_status)).length;
        const lost = rows.filter((r: any) => ['Not Interested', 'Wrong Number'].includes(r.call_status)).length;
        return { name, total_calls: total, warm_deals: warm, lost_deals: lost, success_rate: total > 0 ? parseFloat(((warm / total) * 100).toFixed(1)) : 0.0 };
      });

      leaderboard.sort((a, b) => b.warm_deals - a.warm_deals || b.total_calls - a.total_calls);
      return { success: true, leaderboard };
    } catch (error: any) {
      return { success: false, error: error.message, leaderboard: [] };
    }
  }

  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED', leaderboard: [] };
  try {
    const rows = await sqliteAll(db, `SELECT caller_name as name, COUNT(*) as total_calls, SUM(CASE WHEN call_status IN ('Interested','Callback') THEN 1 ELSE 0 END) as warm_deals, SUM(CASE WHEN call_status IN ('Not Interested','Wrong Number') THEN 1 ELSE 0 END) as lost_deals FROM leads WHERE caller_name IN ('Hamid','Oussama','Kamel') GROUP BY caller_name`, []);
    const leaderboard = callers.map(name => {
      const row = rows.find((r: any) => r.name === name);
      const total = parseInt(row?.total_calls || '0', 10);
      const warm = parseInt(row?.warm_deals || '0', 10);
      const lost = parseInt(row?.lost_deals || '0', 10);
      return { name, total_calls: total, warm_deals: warm, lost_deals: lost, success_rate: total > 0 ? parseFloat(((warm / total) * 100).toFixed(1)) : 0.0 };
    });
    leaderboard.sort((a, b) => b.warm_deals - a.warm_deals || b.total_calls - a.total_calls);
    return { success: true, leaderboard };
  } catch (error: any) {
    return { success: false, error: error.message, leaderboard: [] };
  }
}

// ── 9. Meetings List ──────────────────────────────────────────────────────────
export async function getMeetingsList() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('leads')
        .select('id, agency_name, phone, area, contact_person, meeting_date, caller_name, call_status')
        .not('meeting_date', 'is', null)
        .neq('meeting_date', '')
        .in('call_status', ['Interested', 'Callback'])
        .order('last_called_at', { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return { success: true, meetings: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message, meetings: [] };
    }
  }

  const db = getSqlite();
  if (!db) return { success: false, error: 'DATABASE_NOT_CONFIGURED', meetings: [] };
  try {
    const rows = await sqliteAll(db, `SELECT id, agency_name, phone, area, contact_person, meeting_date, caller_name, call_status FROM leads WHERE meeting_date IS NOT NULL AND meeting_date != '' AND call_status IN ('Interested','Callback') ORDER BY last_called_at DESC LIMIT 50`, []);
    return { success: true, meetings: rows };
  } catch (error: any) {
    return { success: false, error: error.message, meetings: [] };
  }
}
