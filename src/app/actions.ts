'use server';

import { query } from '@/lib/db';

// Helper to check if DB is configured (verifies Postgres or SQLite)
async function checkDbConfigured() {
  try {
    await query('SELECT 1');
    return true;
  } catch (e) {
    console.error('Database connection test failed:', e);
    return false;
  }
}

// 1. Get leads with search, filter, and pagination
export async function getLeads(options: {
  search?: string;
  status?: string;
  priority?: string;
  area?: string;
  page?: number;
  limit?: number;
  excludeLost?: boolean;
}) {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) {
    return { success: false, error: 'DATABASE_NOT_CONFIGURED', leads: [], total: 0 };
  }

  const { search = '', status = '', priority = '', area = '', page = 1, limit = 20, excludeLost = false } = options;
  const offset = (page - 1) * limit;

  let queryText = 'SELECT * FROM leads WHERE 1=1';
  const params: any[] = [];
  let paramIdx = 1;

  if (search) {
    queryText += ` AND (agency_name ILIKE $${paramIdx} OR phone ILIKE $${paramIdx} OR area ILIKE $${paramIdx} OR website ILIKE $${paramIdx} OR contact_person ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (status) {
    queryText += ` AND call_status = $${paramIdx}`;
    params.push(status);
    paramIdx++;
  } else if (excludeLost) {
    queryText += ` AND (call_status IS NULL OR call_status NOT IN ('Not Interested', 'Wrong Number'))`;
  }

  if (priority) {
    queryText += ` AND priority = $${paramIdx}`;
    params.push(parseInt(priority, 10));
    paramIdx++;
  }

  if (area) {
    queryText += ` AND area ILIKE $${paramIdx}`;
    params.push(area);
    paramIdx++;
  }

  // Get total count for pagination
  const countQueryText = queryText.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await query(countQueryText, params);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Sorting: Priority first (1 is highest), then uncalled/callbacks, then review count DESC
  queryText += ` ORDER BY 
    CASE 
      WHEN call_status = 'Callback' THEN 1
      WHEN call_status = 'Not Called' OR call_status IS NULL THEN 2
      WHEN call_status = 'No Answer' THEN 3
      ELSE 4
    END ASC,
    priority ASC,
    review_count DESC 
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    
  params.push(limit, offset);

  try {
    const result = await query(queryText, params);
    return { success: true, leads: result.rows, total };
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return { success: false, error: error.message || 'Failed to fetch leads', leads: [], total: 0 };
  }
}

// 2. Fetch the active dialing queue
export async function getDialerQueue() {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) {
    return { success: false, error: 'DATABASE_NOT_CONFIGURED', queue: [] };
  }

  try {
    // Select leads that are either not called or requested a callback or had no answer,
    // sorted by priority (1 = highest) and review counts.
    const result = await query(`
      SELECT * FROM leads
      WHERE call_status IS NULL OR call_status NOT IN ('Interested', 'Not Interested', 'Wrong Number')
      ORDER BY 
        CASE 
          WHEN call_status = 'Callback' THEN 1
          WHEN call_status = 'Not Called' OR call_status IS NULL THEN 2
          WHEN call_status = 'No Answer' THEN 3
          ELSE 4
        END ASC,
        priority ASC,
        review_count DESC
      LIMIT 15
    `);
    
    return { success: true, queue: result.rows };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch dialer queue', queue: [] };
  }
}

// 3. Update call status manually
export async function updateCallStatus(id: number, status: string, notes: string, callNotes: string, callerName: string) {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) return { success: false, error: 'DATABASE_NOT_CONFIGURED' };

  try {
    await query(`
      UPDATE leads 
      SET 
        call_status = $1, 
        notes = $2, 
        call_notes = $3,
        caller_name = $4,
        last_called_at = CURRENT_TIMESTAMP,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [status, notes, callNotes, callerName, id]);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update status' };
  }
}

// 4. Update core lead details (inline editing)
export async function updateLeadDetails(id: number, fields: {
  agency_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  priority?: number;
  area?: string;
  notes?: string;
  contact_person?: string;
  meeting_date?: string;
}) {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) return { success: false, error: 'DATABASE_NOT_CONFIGURED' };

  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  Object.entries(fields).forEach(([key, val]) => {
    updates.push(`${key} = $${paramIdx}`);
    params.push(val);
    paramIdx++;
  });

  if (updates.length === 0) return { success: false, error: 'No fields provided to update' };

  params.push(id);
  const queryText = `
    UPDATE leads 
    SET ${updates.join(', ')}, last_updated = CURRENT_TIMESTAMP 
    WHERE id = $${paramIdx}
  `;

  try {
    await query(queryText, params);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update lead details' };
  }
}

// 5. Get Analytics summary
export async function getAnalytics() {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) {
    return { success: false, error: 'DATABASE_NOT_CONFIGURED', stats: null };
  }

  try {
    // Status breakdown
    const statusResult = await query(`
      SELECT call_status, COUNT(*) as count 
      FROM leads 
      GROUP BY call_status
    `);

    // Priority breakdown
    const priorityResult = await query(`
      SELECT priority, COUNT(*) as count 
      FROM leads 
      GROUP BY priority 
      ORDER BY priority ASC
    `);

    // Total calls made today
    const callsTodayResult = await query(`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE last_called_at >= CURRENT_DATE
    `);

    // Top areas calling stats
    const areaResult = await query(`
      SELECT area, 
             COUNT(*) as total_leads, 
             SUM(CASE WHEN call_status != 'Not Called' AND call_status IS NOT NULL THEN 1 ELSE 0 END) as called_leads
      FROM leads 
      GROUP BY area 
      ORDER BY total_leads DESC 
      LIMIT 6
    `);

    const statuses = statusResult.rows.reduce((acc: any, row) => {
      if (row.call_status) {
        acc[row.call_status] = parseInt(row.count, 10);
      }
      return acc;
    }, {});

    const priorities = priorityResult.rows.reduce((acc: any, row) => {
      acc[`Priority ${row.priority}`] = parseInt(row.count, 10);
      return acc;
    }, {});

    // Sum total leads in DB
    const countTotal = await query('SELECT COUNT(*) as count FROM leads');
    const totalLeads = parseInt(countTotal.rows[0]?.count || '0', 10);

    const totalCalled = Object.entries(statuses)
      .filter(([status]) => status !== 'Not Called' && status !== 'null' && status !== '')
      .reduce((sum, [_, count]) => sum + (count as number), 0);

    return {
      success: true,
      stats: {
        totalLeads,
        totalCalled,
        callsToday: parseInt(callsTodayResult.rows[0]?.count || '0', 10),
        statuses: {
          notCalled: statuses['Not Called'] || (totalLeads - totalCalled),
          interested: statuses['Interested'] || 0,
          notInterested: statuses['Not Interested'] || 0,
          callback: statuses['Callback'] || 0,
          noAnswer: (statuses['No Answer'] || 0) + (statuses['Busy'] || 0),
          wrongNumber: statuses['Wrong Number'] || 0,
        },
        priorities,
        areas: areaResult.rows.map((row) => ({
          name: row.area,
          total: parseInt(row.total_leads, 10),
          called: parseInt(row.called_leads, 10),
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch analytics', stats: null };
  }
}

// 6. Post-Call AI Note Parser using Gemini API (GLM API Key)
export async function processCallSummaryWithAI(rawText: string) {
  const apiKey = process.env.GLM_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'GLM_API_KEY_MISSING',
      extractedData: {
        call_status: 'Callback',
        meeting_date: 'AI key missing. Manual entry required.',
        contact_person: 'AI key missing.',
        updated_email: null,
        summary: rawText,
      }
    };
  }

  const prompt = `
You are an intelligent data entry assistant for a cold-calling team (Hamid, Oussama, Kamel). 
Your task is to analyze raw, free-form notes written after a call with an Algerian travel agency and extract structured database fields.

Here are the guidelines for call_status:
- "Interested": Spoke to decision-maker, they want our services, or scheduled a product demo/meeting.
- "Callback": Busy, asked to call back on a specific date/time, or requested more info.
- "Not Interested": Direct refusal, said no, or told us not to call again (Lost deal).
- "Wrong Number": Phone number is invalid, disconnected, or belongs to a different business.
- "No Answer": Voicemail, line busy, or rang with no answer.

Analyze this raw call summary:
"""
${rawText}
"""

Extract and respond STRICTLY with a valid JSON object matching this structure (do not output any pre-text or explanation):
{
  "call_status": "Interested" | "Callback" | "Not Interested" | "Wrong Number" | "No Answer",
  "meeting_date": "String representing scheduled date/time of callback/meeting" or null if none,
  "contact_person": "Name of contact person spoken to" or null if unknown,
  "updated_email": "Any email address mentioned in the note to update" or null,
  "summary": "A clean, professional 1-sentence English summary of the call outcome"
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API returned error:', response.statusText);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Safety JSON parse
    const parsedData = JSON.parse(textResult.trim());
    return { success: true, extractedData: parsedData };
  } catch (error: any) {
    console.error('Error processing AI summary:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to AI server',
      extractedData: {
        call_status: 'Callback',
        meeting_date: null,
        contact_person: null,
        updated_email: null,
        summary: 'Error parsing text: ' + rawText,
      }
    };
  }
}

// 7. Process notes with AI and update database directly
export async function updateCallStatusWithAI(
  leadId: number,
  callerName: string,
  rawSummary: string
) {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) return { success: false, error: 'DATABASE_NOT_CONFIGURED' };

  // Parse notes with Gemini
  const aiRes = await processCallSummaryWithAI(rawSummary);
  const data = aiRes.extractedData;

  try {
    // Update database lead with extracted data
    if (data.updated_email) {
      await query(`
        UPDATE leads 
        SET 
          call_status = $1, 
          call_notes = $2,
          caller_name = $3,
          meeting_date = $4,
          contact_person = $5,
          email = $6,
          last_called_at = CURRENT_TIMESTAMP,
          last_updated = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [data.call_status, data.summary, callerName, data.meeting_date, data.contact_person, data.updated_email, leadId]);
    } else {
      await query(`
        UPDATE leads 
        SET 
          call_status = $1, 
          call_notes = $2,
          caller_name = $3,
          meeting_date = $4,
          contact_person = $5,
          last_called_at = CURRENT_TIMESTAMP,
          last_updated = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [data.call_status, data.summary, callerName, data.meeting_date, data.contact_person, leadId]);
    }

    return { success: true, extracted: data };
  } catch (error: any) {
    console.error('Error saving AI processed outcome:', error);
    return { success: false, error: error.message || 'Failed to save parsed details to database' };
  }
}

// 8. Get team calling stats for Hamid, Oussama, and Kamel (reads real statistics)
export async function getTeamLeaderboard() {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) {
    return { success: false, error: 'DATABASE_NOT_CONFIGURED', leaderboard: [] };
  }

  try {
    const result = await query(`
      SELECT 
        caller_name as name,
        COUNT(*) as total_calls,
        SUM(CASE WHEN call_status IN ('Interested', 'Callback') THEN 1 ELSE 0 END) as warm_deals,
        SUM(CASE WHEN call_status IN ('Not Interested', 'Wrong Number') THEN 1 ELSE 0 END) as lost_deals
      FROM leads
      WHERE caller_name IN ('Hamid', 'Oussama', 'Kamel')
      GROUP BY caller_name
    `);

    // Ensure all 3 names are represented even if they have 0 database rows yet
    const callers = ['Hamid', 'Oussama', 'Kamel'];
    const leaderboard = callers.map(name => {
      const row = result.rows.find(r => r.name === name);
      const total = parseInt(row?.total_calls || '0', 10);
      const warm = parseInt(row?.warm_deals || '0', 10);
      const lost = parseInt(row?.lost_deals || '0', 10);
      const success_rate = total > 0 ? parseFloat(((warm / total) * 100).toFixed(1)) : 0.0;
      
      return {
        name,
        total_calls: total,
        warm_deals: warm,
        lost_deals: lost,
        success_rate
      };
    });

    // Sort by warm deals first, then total calls
    leaderboard.sort((a, b) => b.warm_deals - a.warm_deals || b.total_calls - a.total_calls);

    return { success: true, leaderboard };
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: error.message };
  }
}

// 9. Fetch all upcoming meetings and deadlines
export async function getMeetingsList() {
  const isConfigured = await checkDbConfigured();
  if (!isConfigured) {
    return { success: false, error: 'DATABASE_NOT_CONFIGURED', meetings: [] };
  }

  try {
    const result = await query(`
      SELECT id, agency_name, phone, area, contact_person, meeting_date, caller_name, call_status
      FROM leads
      WHERE meeting_date IS NOT NULL AND meeting_date != '' AND call_status IN ('Interested', 'Callback')
      ORDER BY last_called_at DESC
      LIMIT 50
    `);

    return { success: true, meetings: result.rows };
  } catch (error: any) {
    console.error('Error fetching meetings list:', error);
    return { success: false, error: error.message, meetings: [] };
  }
}
