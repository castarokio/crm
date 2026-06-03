'use server';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  clearAuthSession,
  getCallerSession,
  hasPortalSession,
  requireAdminSession,
  requireCallerSession,
  requireRole,
  requireWritableSession,
  setCallerSession,
  setPortalSession,
  type CallerRole,
} from '@/lib/auth-session';
import { ALLOWED_CALL_STATUSES, ALLOWED_DEAL_STAGES } from '@/lib/constants';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

const CONVERTED_STATUSES = ['Accepted', 'Client Configured'];
const WARM_STATUSES = ['Interested'];
const FOLLOWUP_STATUSES = ['Callback', 'Busy', 'No Answer'];
const TREATED_STATUSES = ['Treated'];
const ACTIVE_ASSIGNMENT_FILTER = 'call_status.is.null,call_status.eq.Not Called';
const PIN_HASH_PREFIX = 'scrypt';
const PIN_HASH_BYTES = 32;

const IMPORTABLE_LEAD_FIELDS = [
  'agency_name', 'area', 'maps_link', 'address', 'phone', 'phone_2', 'email', 'email_2',
  'website', 'website_quality', 'facebook', 'instagram', 'tiktok', 'linkedin', 'social_link',
  'google_rating', 'review_count', 'followers_if_visible', 'facebook_followers',
  'instagram_followers', 'running_ads', 'services', 'notes', 'priority', 'contact_person'
];
const IMPORT_HEADER_ALIASES: Record<string, string> = {
  name: 'agency_name',
  business_name: 'agency_name',
  company: 'agency_name',
  city: 'area',
  region: 'area',
  google_maps: 'maps_link',
  map_link: 'maps_link',
  phone_number: 'phone',
  mobile: 'phone',
  alt_phone: 'phone_2',
  second_phone: 'phone_2',
  mail: 'email',
  email_address: 'email',
  alt_email: 'email_2',
  second_email: 'email_2',
  fb: 'facebook',
  ig: 'instagram',
  tik_tok: 'tiktok',
  linked_in: 'linkedin',
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCsvText(csvText: string): Array<Record<string, any>> {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(header => {
    const normalized = header.trim().toLowerCase().replace(/[\s-]+/g, '_');
    return IMPORT_HEADER_ALIASES[normalized] || normalized;
  });
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row: Record<string, any> = {};
    headers.forEach((header, i) => {
      if (!IMPORTABLE_LEAD_FIELDS.includes(header)) return;
      const rawValue = values[i]?.trim() || '';
      if (!rawValue) return;
      if (['google_rating'].includes(header)) {
        row[header] = Number.parseFloat(rawValue) || 0;
      } else if (['review_count', 'priority'].includes(header)) {
        row[header] = Number.parseInt(rawValue, 10) || (header === 'priority' ? 3 : 0);
      } else {
        row[header] = rawValue;
      }
    });
    return { row_number: index + 2, ...row };
  });
}

function normalizeForDuplicate(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhoneForDuplicate(phone?: string | null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return '213' + digits.substring(1);
  }
  return digits;
}

function normalizePhoneValues(phone?: string | null) {
  return (phone || '')
    .split(/\r?\n|[,;]/)
    .map(value => normalizePhoneForDuplicate(value))
    .filter(Boolean);
}

function escapePostgrestFilterValue(value: string) {
  return value.replace(/[(),.%]/g, char => `\\${char}`);
}

function assertAllowedCallStatus(status: string) {
  if (!(ALLOWED_CALL_STATUSES as readonly string[]).includes(status)) throw new Error('INVALID_CALL_STATUS');
}

function assertAllowedDealStage(stage: string) {
  if (!(ALLOWED_DEAL_STAGES as readonly string[]).includes(stage)) throw new Error('INVALID_DEAL_STAGE');
}

function hashCallerPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, PIN_HASH_BYTES).toString('hex');
  return `${PIN_HASH_PREFIX}$${salt}$${hash}`;
}

function verifyCallerPin(storedPin: string, suppliedPin: string) {
  if (!storedPin.startsWith(`${PIN_HASH_PREFIX}$`)) {
    return storedPin === suppliedPin;
  }

  const [, salt, expectedHex] = storedPin.split('$');
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(suppliedPin, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function safeStringEqual(expected: string, supplied: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

const LEAD_LIST_COLUMNS = [
  'id',
  'agency_name',
  'phone',
  'phone_2',
  'email',
  'email_2',
  'website',
  'website_quality',
  'facebook',
  'instagram',
  'tiktok',
  'linkedin',
  'social_link',
  'google_rating',
  'review_count',
  'area',
  'address',
  'maps_link',
  'priority',
  'call_status',
  'call_notes',
  'notes',
  'contact_person',
  'meeting_date',
  'caller_name',
  'assigned_to',
  'last_called_at',
  'followers_if_visible',
  'facebook_followers',
  'instagram_followers',
  'running_ads',
  'services',
].join(',');

async function getDataSafetySchemaStatus() {
  const supabase = requireSupabase();
  const [leadProbe, batchProbe] = await Promise.all([
    supabase.from('leads').select('id, import_batch_id, deleted_at, source_file, created_at').limit(1),
    supabase.from('import_batches').select('id').limit(1),
  ]);

  return {
    ready: !leadProbe.error && !batchProbe.error,
    leadsReady: !leadProbe.error,
    batchesReady: !batchProbe.error,
    error: leadProbe.error?.message || batchProbe.error?.message || null,
  };
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

  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    let q = supabase.from('leads').select(LEAD_LIST_COLUMNS, { count: 'planned' });

    if (search) {
      const safeSearch = escapePostgrestFilterValue(search);
      q = q.or([
        `agency_name.ilike.%${safeSearch}%`,
        `phone.ilike.%${safeSearch}%`,
        `phone_2.ilike.%${safeSearch}%`,
        `email.ilike.%${safeSearch}%`,
        `email_2.ilike.%${safeSearch}%`,
        `area.ilike.%${safeSearch}%`,
        `address.ilike.%${safeSearch}%`,
        `website.ilike.%${safeSearch}%`,
        `maps_link.ilike.%${safeSearch}%`,
        `facebook.ilike.%${safeSearch}%`,
        `instagram.ilike.%${safeSearch}%`,
        `tiktok.ilike.%${safeSearch}%`,
        `linkedin.ilike.%${safeSearch}%`,
        `social_link.ilike.%${safeSearch}%`,
        `contact_person.ilike.%${safeSearch}%`,
      ].join(','));
    }
    if (status === 'Followups') {
      q = q.in('call_status', FOLLOWUP_STATUSES);
    } else if (status === 'No Answer / Busy') {
      q = q.in('call_status', ['Busy', 'No Answer']);
    } else if (status === 'WarmLeads') {
      q = q.in('call_status', WARM_STATUSES);
    } else if (status === 'GoodClients') {
      q = q.in('call_status', CONVERTED_STATUSES);
    } else if (status === 'Lost') {
      q = q.in('call_status', ['Not Interested', 'Wrong Number']);
    } else if (status === 'Treated') {
      q = q.in('call_status', TREATED_STATUSES);
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
    const session = await requireCallerSession();
    const effectiveCallerName = session.name;
    const supabase = requireSupabase();
    
    // Select leads that are fresh or explicitly recalled
    let q = supabase
      .from('leads')
      .select(LEAD_LIST_COLUMNS, { count: 'planned' })
      .or('call_status.eq.Not Called,call_status.is.null,call_status.eq.Recalled');

    if (effectiveCallerName) {
      // Must be assigned to the caller OR unassigned
      const safeCaller = escapePostgrestFilterValue(effectiveCallerName);
      q = q.or(`assigned_to.eq.${safeCaller},assigned_to.is.null`);
      
      // Must not be locked by another caller (lease older than 5 minutes is expired)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      q = q.or(`locked_by.is.null,locked_by.eq.${safeCaller},locked_at.lt.${fiveMinutesAgo}`);
    }

    const { data, count, error } = await q
      .order('priority', { ascending: true })
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .order('review_count', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return { success: true, queue: data || [], total: count || (data || []).length };
  } catch (error: any) {
    console.error('[getDialerQueue]', error.message);
    return { success: false, error: error.message, queue: [] };
  }
}

// ── 3. Update Call Status ─────────────────────────────────────────────────────
export async function updateCallStatus(id: number, status: string, notes: string, callNotes: string, callerName: string, meetingDate?: string) {
  try {
    const session = await requireWritableSession();
    assertAllowedCallStatus(status);
    const supabase = requireSupabase();
    
    const updatePayload: any = {
      call_status: status,
      notes,
      call_notes: callNotes,
      caller_name: session.name,
      assigned_to: session.name, // Lock lead to this caller upon contact
      last_called_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    if (meetingDate !== undefined) {
      updatePayload.meeting_date = meetingDate;
    }

    const { error } = await supabase.from('leads').update(updatePayload).eq('id', id);
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'UPDATE_CALL_STATUS', `Updated call status to "${status}". Notes: ${callNotes || notes}`, id);

    const { error: historyError } = await supabase.from('call_history').insert({
      lead_id: id,
      caller_name: session.name,
      call_status: status,
      notes: callNotes || notes
    });
    if (historyError) throw new Error(historyError.message);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function computeLeadPriority(lead: {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  review_count?: number | null;
}) {
  const websiteVal = lead.website ? String(lead.website).trim().toLowerCase() : '';
  const hasWebsite = websiteVal !== '' && websiteVal !== 'not found' && websiteVal !== 'none';
  
  const fbVal = lead.facebook ? String(lead.facebook).trim().toLowerCase() : '';
  const hasFb = fbVal !== '' && fbVal !== 'not found' && fbVal !== 'none';

  const igVal = lead.instagram ? String(lead.instagram).trim().toLowerCase() : '';
  const hasIg = igVal !== '' && igVal !== 'not found' && igVal !== 'none';
  
  const hasSocials = hasFb || hasIg;
  const reviewCount = lead.review_count || 0;

  if (!hasWebsite && hasSocials) {
    return 1; // P1: High Socials, No Web
  }
  if (hasWebsite && reviewCount >= 30) {
    return 2; // P2: High Reviews, Low Web
  }
  if (!hasWebsite && !hasSocials) {
    return 4; // P4: Low
  }
  return 3; // P3: Standard
}

// ── 4. Update Lead Details ────────────────────────────────────────────────────
export async function updateLeadDetails(id: number, fields: {
  agency_name?: string; phone?: string; phone_2?: string; email?: string; email_2?: string; website?: string;
  website_quality?: string;
  facebook?: string; instagram?: string; tiktok?: string; linkedin?: string; social_link?: string;
  priority?: number; area?: string; notes?: string; contact_person?: string; meeting_date?: string;
  address?: string; maps_link?: string; call_status?: string; caller_name?: string | null; assigned_to?: string | null;
  review_count?: number; google_rating?: number;
}, editorName?: string) {
  try {
    const session = await requireWritableSession();
    if (fields.call_status) assertAllowedCallStatus(fields.call_status);
    if (session.role !== 'Admin') {
      const callerNameAllowed = !('caller_name' in fields) || fields.caller_name === session.name || fields.caller_name == null;
      const assignedToAllowed = !('assigned_to' in fields) || fields.assigned_to === session.name || fields.assigned_to == null;
      if (!callerNameAllowed || !assignedToAllowed) throw new Error('FORBIDDEN_FIELD_UPDATE');
    }
    // Input Validations
    if ('email' in fields) {
      const email = fields.email ? String(fields.email).trim() : '';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('INVALID_EMAIL_FORMAT');
      }
    }
    if ('email_2' in fields) {
      const email_2 = fields.email_2 ? String(fields.email_2).trim() : '';
      if (email_2) {
        const emails = email_2.split(/\r?\n|[,;]/).map(e => e.trim()).filter(Boolean);
        for (const email of emails) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('INVALID_ALT_EMAIL_FORMAT');
          }
        }
      }
    }
    if ('priority' in fields && fields.priority !== undefined) {
      const prio = Number(fields.priority);
      if (isNaN(prio) || prio < 1 || prio > 5) {
        throw new Error('INVALID_PRIORITY_RANGE');
      }
    }
    if ('google_rating' in fields && fields.google_rating !== undefined) {
      const rating = Number(fields.google_rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        throw new Error('INVALID_RATING_RANGE');
      }
    }

    const supabase = requireSupabase();
    const finalFields = { ...fields };
    
    // Auto-calculate priority if website/socials change and priority isn't overridden
    const hasWebsite = 'website' in fields;
    const hasFacebook = 'facebook' in fields;
    const hasInstagram = 'instagram' in fields;
    const hasReviews = 'review_count' in fields;
    
    if ((hasWebsite || hasFacebook || hasInstagram || hasReviews) && !('priority' in fields)) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('website, facebook, instagram, review_count, priority')
        .eq('id', id)
        .single();
        
      if (leadData) {
        const merged = {
          website: hasWebsite ? fields.website : leadData.website,
          facebook: hasFacebook ? fields.facebook : leadData.facebook,
          instagram: hasInstagram ? fields.instagram : leadData.instagram,
          review_count: hasReviews ? fields.review_count : leadData.review_count,
        };
        const computed = computeLeadPriority(merged);
        if (computed !== leadData.priority) {
          finalFields.priority = computed;
        }
      }
    }

    const { error } = await supabase.from('leads').update({
      ...finalFields,
      last_updated: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'EDIT_LEAD_DETAILS', `Edited lead fields: ${Object.keys(fields).join(', ')}`, id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 5. Analytics ──────────────────────────────────────────────────────────────
export async function getAnalytics() {
  try {
    await requireCallerSession();
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
      supabase.from('leads').select('id', { count: 'planned', head: true }),
      supabase.from('leads').select('id', { count: 'planned', head: true })
        .gte('last_called_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Interested'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Accepted'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Client Configured'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Callback'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Not Interested'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Wrong Number'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'No Answer'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Busy'),
    ]);

    const totalLeads = totalRes.count || 0;
    const interested = interestedRes.count || 0;
    const converted = (acceptedRes.count || 0) + (configuredRes.count || 0);
    const callback = callbackRes.count || 0;
    const notInterested = notInterestedRes.count || 0;
    const wrongNumber = wrongNumberRes.count || 0;
    const noAnswer = (noAnswerRes.count || 0) + (busyRes.count || 0);

    const totalCalled = interested + converted + callback + notInterested + wrongNumber + noAnswer;
    const { count: freshCount } = await supabase
      .from('leads')
      .select('id', { count: 'planned', head: true })
      .or('call_status.is.null,call_status.eq.Not Called,call_status.eq.Recalled');

    return {
      success: true,
      stats: {
        totalLeads,
        totalCalled,
        callsToday: todayRes.count || 0,
        statuses: {
          notCalled: freshCount || 0,
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

export async function getTargetInventoryCounts() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const [totalRes, warmRes, convertedRes, followupRes, lostRes, treatedRes] = await Promise.all([
      supabase.from('leads').select('id', { count: 'planned', head: true }),
      supabase.from('leads').select('id', { count: 'planned', head: true }).eq('call_status', 'Interested'),
      supabase.from('leads').select('id', { count: 'planned', head: true }).in('call_status', ['Accepted', 'Client Configured']),
      supabase.from('leads').select('id', { count: 'planned', head: true }).in('call_status', ['Callback', 'Busy', 'No Answer']),
      supabase.from('leads').select('id', { count: 'planned', head: true }).in('call_status', ['Not Interested', 'Wrong Number']),
      supabase.from('leads').select('id', { count: 'planned', head: true }).in('call_status', TREATED_STATUSES),
    ]);

    const error = totalRes.error || warmRes.error || convertedRes.error || followupRes.error || lostRes.error || treatedRes.error;
    if (error) throw new Error(error.message);

    return {
      success: true,
      counts: {
        total: totalRes.count || 0,
        warm: warmRes.count || 0,
        converted: convertedRes.count || 0,
        followups: followupRes.count || 0,
        lost: lostRes.count || 0,
        treated: treatedRes.count || 0,
      },
    };
  } catch (error: any) {
    console.error('[getTargetInventoryCounts]', error.message);
    return { success: false, error: error.message, counts: null };
  }
}

// ── 6. AI Post-Call Parser ────────────────────────────────────────────────────
export async function processCallSummaryWithAI(rawText: string) {
  await requireWritableSession();
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

// ── 6b. AI Cold Pitch Generator ───────────────────────────────────────────────
export async function generatePitchWithAI(options: {
  agencyName: string;
  website?: string;
  websiteQuality?: string;
  area?: string;
  callerName: string;
  customInstruction?: string;
}) {
  await requireWritableSession();
  const apiKey = process.env.GLM_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GLM_API_KEY_MISSING' };
  }

  const isNoWeb = !options.website || options.website === 'Not found' || options.website.toLowerCase() === 'none';

  const basePrompt = `Tu es un expert en vente et prospection commerciale (cold outreach) pour Web-OS.
Rédige un message d'accroche personnalisé et très court (maximum 3 phrases) en français, chaleureux et persuasif, destiné à une agence de voyages en Algérie pour lui proposer de créer ou d'optimiser son site web.

Détails de l'agence de voyages :
- Nom de l'agence : ${options.agencyName}
- Ville : ${options.area || 'Algérie'}
- Site web existant : ${isNoWeb ? "Non (elle n'a pas de site internet, seulement des réseaux sociaux)" : `Oui (${options.website})`}
- Qualité du site existant : ${options.websiteQuality || 'Non spécifiée'}
- Nom du commercial qui prospecte : ${options.callerName}

${options.customInstruction ? `Consignes supplémentaires : "${options.customInstruction}"` : ''}

Consignes de style :
- Commence par une formule chaleureuse (ex: "Salam", "Bonjour").
- Présente-toi rapidement ("... de Web-OS").
- Mentionne un détail spécifique (ex: l'absence de site internet pour générer des réservations en direct, ou le fait que leur site actuel peut être optimisé pour le mobile/vitesse de chargement).
- Reste extrêmement concis et direct pour WhatsApp ou DM Instagram. Pas de blabla inutile.
- Termine par une question d'engagement simple (ex: "Disponible pour en discuter ?").

Réponds UNIQUEMENT avec le texte du message généré. Aucun autre commentaire.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: basePrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      }
    );
    if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: true, pitch: textResult.trim() };
  } catch (error: any) {
    console.error('[generatePitchWithAI]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 7. AI Update + Save ───────────────────────────────────────────────────────
export async function updateCallStatusWithAI(leadId: number, callerName: string, rawSummary: string) {
  const session = await requireWritableSession();
  const aiRes = await processCallSummaryWithAI(rawSummary);
  const data = aiRes.extractedData;
  assertAllowedCallStatus(data.call_status);

  try {
    const supabase = requireSupabase();
    const updatePayload: any = {
      call_status: data.call_status,
      call_notes: data.summary,
      caller_name: session.name,
      meeting_date: data.meeting_date,
      contact_person: data.contact_person,
      last_called_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      assigned_to: session.name,
    };
    if (data.updated_email) updatePayload.email = data.updated_email;
    const { error } = await supabase.from('leads').update(updatePayload).eq('id', leadId);
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'UPDATE_CALL_STATUS_AI', `AI updated status to "${data.call_status}". Summary: ${data.summary || rawSummary}`, leadId);

    const { error: historyError } = await supabase.from('call_history').insert({
      lead_id: leadId,
      caller_name: session.name,
      call_status: data.call_status,
      notes: data.summary || rawSummary
    });
    if (historyError) throw new Error(historyError.message);

    return { success: true, extracted: data };
  } catch (error: any) {
    console.error('[updateCallStatusWithAI]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 8. Team Leaderboard ───────────────────────────────────────────────────────
export async function getTeamLeaderboard() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    
    // Fetch all profiles first
    const { data: profiles, error: profErr } = await supabase.from('caller_profiles').select('name, gender');
    const callers = (profiles && !profErr && profiles.length > 0)
      ? profiles
      : [{ name: 'Hamid', gender: 'Male' }, { name: 'Oussama', gender: 'Male' }, { name: 'Kamel', gender: 'Male' }];

    // Count call attempts from the immutable history table, not current lead ownership.
    const { data: leads, error: leadsErr } = await supabase
      .from('call_history')
      .select('caller_name, call_status')
      .not('caller_name', 'is', null);

    if (leadsErr) throw new Error(leadsErr.message);

    const countsMap: Record<string, { total: number; warm: number; lost: number }> = {};
    callers.forEach((c: any) => {
      countsMap[c.name] = { total: 0, warm: 0, lost: 0 };
    });

    if (leads) {
      leads.forEach((lead: any) => {
        const name = lead.caller_name;
        if (!name) return;
        if (!countsMap[name]) {
          countsMap[name] = { total: 0, warm: 0, lost: 0 };
        }
        const status = lead.call_status;
        countsMap[name].total++;
        if (['Interested', 'Accepted', 'Client Configured'].includes(status)) {
          countsMap[name].warm++;
        } else if (['Not Interested', 'Wrong Number'].includes(status)) {
          countsMap[name].lost++;
        }
      });
    }

    const leaderboard = callers.map((caller: any) => {
      const name = caller.name;
      const stats = countsMap[name] || { total: 0, warm: 0, lost: 0 };
      const total = stats.total;
      const warm = stats.warm;
      const lost = stats.lost;
      return {
        name,
        gender: caller.gender || 'Male',
        total_calls: total,
        warm_deals: warm,
        lost_deals: lost,
        success_rate: total > 0 ? parseFloat(((warm / total) * 100).toFixed(1)) : 0.0,
      };
    });

    leaderboard.sort((a: any, b: any) => b.warm_deals - a.warm_deals || b.total_calls - a.total_calls);
    return { success: true, leaderboard };
  } catch (error: any) {
    console.error('[getTeamLeaderboard]', error.message);
    return { success: false, error: error.message, leaderboard: [] };
  }
}

// ── 9. Meetings List ──────────────────────────────────────────────────────────
export async function getMeetingsList() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select(LEAD_LIST_COLUMNS)
      .not('meeting_date', 'is', null)
      .neq('meeting_date', '')
      .order('last_called_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return { success: true, meetings: data || [] };
  } catch (error: any) {
    console.error('[getMeetingsList]', error.message);
    return { success: false, error: error.message, meetings: [] };
  }
}

export async function getLeadAreas() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const rows: Array<{ area: string | null }> = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('leads')
        .select('area')
        .not('area', 'is', null)
        .neq('area', '')
        .order('area', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(error.message);
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    const areas = Array.from(new Set<string>(rows
      .map((row: any) => String(row.area || '').trim())
      .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));

    return { success: true, areas };
  } catch (error: any) {
    console.error('[getLeadAreas]', error.message);
    return { success: false, error: error.message, areas: [] };
  }
}

// ── 10. Admin Lead Distribution ──────────────────────────────────────────────
export async function assignLeadsByRegion(adminCallerName: string, caller: string, region: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: caller })
      .ilike('area', `%${region}%`)
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'ALLOCATE_REGION', `Assigned uncalled ${region} leads to ${caller}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignLeadsByPriority(adminCallerName: string, caller: string, priority: number) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: caller })
      .eq('priority', priority)
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'ALLOCATE_PRIORITY', `Assigned uncalled priority ${priority} leads to ${caller}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clearAssignments(adminCallerName: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: null })
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'CLEAR_ASSIGNMENTS', `Cleared caller assignments for uncalled targets`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function splitLeadsEqually(adminCallerName: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const { data: leads, error: fetchErr } = await supabase
      .from('leads')
      .select('id')
      .is('assigned_to', null)
      .or(ACTIVE_ASSIGNMENT_FILTER);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!leads || leads.length === 0) return { success: true, totalAssigned: 0 };

    const callers = await getActiveCallers(supabase);
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

    const results = await Promise.all(promises);
    const updateError = results.find(result => result?.error)?.error;
    if (updateError) throw new Error(updateError.message);
    await logAuditEvent(session.name, 'SPLIT_LEADS', `Divided ${totalLeads} unassigned uncalled leads equally among caller teams`);
    return { success: true, totalAssigned: totalLeads };
  } catch (error: any) {
    console.error('[splitLeadsEqually]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 11. Call History Actions ──────────────────────────────────────────────────
export async function getCallHistory(leadId: number) {
  try {
    await requireCallerSession();
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
export async function deleteLeadPermanently(adminCallerName: string, leadId: number) {
  try {
    const session = await requireWritableSession();
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
    await logAuditEvent(session.name, 'DELETE_LEAD', `Permanently deleted lead #${leadId}`, leadId);

    return { success: true };
  } catch (error: any) {
    console.error('[deleteLeadPermanently]', error.message);
    return { success: false, error: error.message };
  }
}

export async function restoreLeadToQueue(leadId: number) {
  try {
    await requireWritableSession();
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
    await requireRole(['Admin', 'Supervisor']);
    const supabase = requireSupabase();
    const callers = await getActiveCallers(supabase);
    const promises = callers.map(async (name) => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'planned', head: true })
        .eq('assigned_to', name)
        .or(ACTIVE_ASSIGNMENT_FILTER);
      if (error) throw new Error(error.message);
      return { name, count: count || 0 };
    });

    const { count: unassignedCount, error: unassignedErr } = await supabase
      .from('leads')
      .select('id', { count: 'planned', head: true })
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
export async function assignLeadsByRange(adminCallerName: string, caller: string, startId: number, endId: number, forceReassign: boolean = false) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    let q = supabase
      .from('leads')
      .update({ assigned_to: caller })
      .gte('id', startId)
      .lte('id', endId);

    if (!forceReassign) {
      q = q.is('assigned_to', null);
    }

    // Protect converted leads (Interested, Accepted, Client Configured)
    q = q.not('call_status', 'in', '("Interested","Accepted","Client Configured")');

    const { error } = await q;

    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'ALLOCATE_RANGE', `Assigned ID range #${startId} - #${endId} to ${caller} (Overwrite: ${forceReassign})`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── 14. Data Safety / Import / Backup ────────────────────────────────────────
export async function checkDataSafetySchema() {
  try {
    await requireAdminSession();
    const status = await getDataSafetySchemaStatus();
    return { success: true, ...status };
  } catch (error: any) {
    return { success: false, ready: false, error: error.message };
  }
}

export async function downloadFullBackup(adminCallerName: string = 'Hamid') {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const [leadsRes, historyRes, batchesRes] = await Promise.all([
      supabase.from('leads').select('*').order('id', { ascending: true }),
      supabase.from('call_history').select('*').order('created_at', { ascending: true }),
      supabase.from('import_batches').select('*').order('created_at', { ascending: false }),
    ]);

    if (leadsRes.error) throw new Error(leadsRes.error.message);
    if (historyRes.error) throw new Error(historyRes.error.message);

    await logAuditEvent(session.name, 'EXPORT_BACKUP', `Downloaded full JSON database backup (${leadsRes.data?.length || 0} leads)`);
    return {
      success: true,
      backup: {
        exported_at: new Date().toISOString(),
        version: 1,
        leads: leadsRes.data || [],
        call_history: historyRes.data || [],
        import_batches: batchesRes.error ? [] : (batchesRes.data || []),
        warnings: batchesRes.error ? ['import_batches table missing; run data_safety_migration.sql for batch tracking.'] : [],
      },
    };
  } catch (error: any) {
    console.error('[downloadFullBackup]', error.message);
    return { success: false, error: error.message, backup: null };
  }
}

export async function previewLeadImport(csvText: string) {
  try {
    await requireAdminSession();
    const supabase = requireSupabase();
    const parsedRows = parseCsvText(csvText).filter(row => row.agency_name || row.phone || row.maps_link);
    if (!parsedRows.length) {
      return { success: false, error: 'No usable rows found. Include headers like agency_name, area, phone, maps_link.', preview: null };
    }

    const existingRows = await getAllLeadDuplicateFields(supabase);
    const seenImportKeys = new Set<string>();
    const rows = parsedRows.map((row: any) => {
      const reasons: string[] = [];
      const phoneNormalized = normalizePhoneForDuplicate(row.phone);
      const phone2Normalized = normalizePhoneForDuplicate(row.phone_2);
      const mapsLink = normalizeForDuplicate(row.maps_link);
      const agencyArea = `${normalizeForDuplicate(row.agency_name)}|${normalizeForDuplicate(row.area)}`;

      if (!row.agency_name) reasons.push('Missing agency_name');
      if (!row.phone && !row.maps_link && !row.website) reasons.push('Missing phone/maps_link/website');

      if (phoneNormalized && existingRows.some((lead: any) =>
        normalizePhoneValues(lead.phone).includes(phoneNormalized) ||
        normalizePhoneValues(lead.phone_2).includes(phoneNormalized)
      )) {
        reasons.push('Duplicate phone');
      } else if (phone2Normalized && existingRows.some((lead: any) =>
        normalizePhoneValues(lead.phone).includes(phone2Normalized) ||
        normalizePhoneValues(lead.phone_2).includes(phone2Normalized)
      )) {
        reasons.push('Duplicate phone');
      }

      if (mapsLink && existingRows.some((lead: any) => normalizeForDuplicate(lead.maps_link) === mapsLink)) reasons.push('Duplicate maps_link');
      if (row.agency_name && row.area && existingRows.some((lead: any) => `${normalizeForDuplicate(lead.agency_name)}|${normalizeForDuplicate(lead.area)}` === agencyArea)) {
        reasons.push('Duplicate agency + area');
      }

      const importKey = phoneNormalized || phone2Normalized || mapsLink || agencyArea;
      if (importKey && seenImportKeys.has(importKey)) reasons.push('Duplicate inside import file');
      if (importKey) seenImportKeys.add(importKey);

      return {
        ...row,
        priority: row.priority || 3,
        call_status: 'Not Called',
        duplicate_reasons: reasons,
        importable: reasons.length === 0,
      };
    });

    const importable = rows.filter(row => row.importable).length;
    return {
      success: true,
      preview: {
        total_rows: rows.length,
        importable_rows: importable,
        skipped_rows: rows.length - importable,
        rows,
      },
    };
  } catch (error: any) {
    console.error('[previewLeadImport]', error.message);
    return { success: false, error: error.message, preview: null };
  }
}

export async function commitLeadImport(rows: any[], fileName: string, createdBy: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const schema = await getDataSafetySchemaStatus();
    if (!schema.ready) {
      return { success: false, error: `MIGRATION_REQUIRED: ${schema.error || 'Run scripts/data_safety_migration.sql first.'}` };
    }

    const batchId = `batch_${Date.now()}`;
    const importRows = rows.filter(row => row.importable).map(row => {
      const clean: Record<string, any> = {};
      IMPORTABLE_LEAD_FIELDS.forEach(field => {
        if (row[field] !== undefined && row[field] !== '') clean[field] = row[field];
      });
      return {
        ...clean,
        priority: clean.priority || 3,
        call_status: 'Not Called',
        caller_name: null,
        assigned_to: null,
        call_notes: null,
        meeting_date: null,
        last_called_at: null,
        import_batch_id: batchId,
        source_file: fileName || 'manual-import.csv',
      };
    });

    if (!importRows.length) return { success: false, error: 'No importable rows selected.' };

    const { error: batchError } = await supabase.from('import_batches').insert({
      id: batchId,
      file_name: fileName || 'manual-import.csv',
      total_rows: rows.length,
      inserted_rows: importRows.length,
      skipped_rows: rows.length - importRows.length,
        created_by: session.name,
    });
    if (batchError) throw new Error(batchError.message);

    for (let i = 0; i < importRows.length; i += 500) {
      const { error } = await supabase.from('leads').insert(importRows.slice(i, i + 500));
      if (error) throw new Error(error.message);
    }

    await logAuditEvent(session.name, 'COMMIT_IMPORT', `Imported ${importRows.length} leads from file: ${fileName} (skipped ${rows.length - importRows.length} duplicates)`);
    return { success: true, batchId, inserted: importRows.length, skipped: rows.length - importRows.length };
  } catch (error: any) {
    console.error('[commitLeadImport]', error.message);
    return { success: false, error: error.message };
  }
}

export async function undoLastImport(adminCallerName: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const schema = await getDataSafetySchemaStatus();
    if (!schema.ready) {
      return { success: false, error: `MIGRATION_REQUIRED: ${schema.error || 'Run scripts/data_safety_migration.sql first.'}` };
    }

    const { data: batches, error: batchError } = await supabase
      .from('import_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (batchError) throw new Error(batchError.message);
    const batch = batches?.[0];
    if (!batch) return { success: false, error: 'No import batch found to undo.' };

    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('import_batch_id', batch.id);
    if (countError) throw new Error(countError.message);

    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('import_batch_id', batch.id);
    if (deleteError) throw new Error(deleteError.message);

    const { error: batchDeleteError } = await supabase
      .from('import_batches')
      .delete()
      .eq('id', batch.id);
    if (batchDeleteError) throw new Error(batchDeleteError.message);

    await logAuditEvent(session.name, 'UNDO_IMPORT', `Undid import batch ${batch.id}, removing ${count || 0} leads`);
    return { success: true, batchId: batch.id, removed: count || 0 };
  } catch (error: any) {
    console.error('[undoLastImport]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 15. Active Dialer Locking System ──────────────────────────────────────────
export async function lockLead(leadId: number, callerName: string) {
  try {
    const session = await requireWritableSession();
    const effectiveCallerName = session.name;
    const supabase = requireSupabase();
    const now = new Date().toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('leads')
      .update({
        locked_by: effectiveCallerName,
        locked_at: now
      })
      .eq('id', leadId)
      .or(`locked_by.is.null,locked_by.eq.${escapePostgrestFilterValue(effectiveCallerName)},locked_at.lt.${fiveMinutesAgo}`)
      .select('id');

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { success: false, error: 'LEAD_LOCKED_BY_OTHER' };
    }
    return { success: true };
  } catch (error: any) {
    console.error('[lockLead]', error.message);
    return { success: false, error: error.message };
  }
}

export async function unlockLead(leadId: number, callerName: string) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({
        locked_by: null,
        locked_at: null
      })
      .eq('id', leadId)
      .eq('locked_by', session.name);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('[unlockLead]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 16. Recall Lead Database Integration ──────────────────────────────────────
export async function recallLead(leadId: number, callerName: string) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update({
        call_status: 'Recalled',
        assigned_to: session.name,
        locked_by: session.name,
        locked_at: now,
        last_updated: now
      })
      .eq('id', leadId);

    if (error) throw new Error(error.message);

    const { error: historyError } = await supabase.from('call_history').insert({
      lead_id: leadId,
      caller_name: session.name,
      call_status: 'Recalled',
      notes: 'Lead recalled and pushed to calling queue.'
    });
    if (historyError) throw new Error(historyError.message);

    return { success: true };
  } catch (error: any) {
    console.error('[recallLead]', error.message);
    return { success: false, error: error.message };
  }
}

// ── 17. Reset Campaign to Zero ────────────────────────────────────────────────
export async function resetCampaign(pin: string, adminCallerName: string = 'Hamid') {
  try {
    const session = await requireAdminSession();
    const adminPin = process.env.ADMIN_RESET_PIN;
    if (!adminPin) throw new Error('ADMIN_RESET_PIN_NOT_CONFIGURED');
    if (!safeStringEqual(adminPin, pin)) {
      throw new Error('INVALID_ADMIN_PIN');
    }
    const supabase = requireSupabase();
    
    // Reset all leads to fresh status
    const { error: resetErr } = await supabase
      .from('leads')
      .update({
        call_status: 'Not Called',
        call_notes: '',
        caller_name: null,
        assigned_to: null,
        meeting_date: null,
        last_called_at: null,
        locked_by: null,
        locked_at: null,
        last_updated: new Date().toISOString()
      })
      .neq('id', 0); // Updates all rows

    if (resetErr) throw new Error(resetErr.message);

    // Delete all call history logs
    const { error: historyErr } = await supabase
      .from('call_history')
      .delete()
      .neq('id', 0);

    if (historyErr) throw new Error(historyErr.message);

    await logAuditEvent(session.name, 'RESET_CAMPAIGN', `Reset entire campaign to zero (wiped status, locks, assignments, and call history)`);
    return { success: true };
  } catch (error: any) {
    console.error('[resetCampaign]', error.message);
    return { success: false, error: error.message };
  }
}

// Helper to get all active callers from caller_profiles, falling back to Hamid, Oussama, Kamel
async function getActiveCallers(supabase: any): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('caller_profiles').select('name');
    if (error || !data || data.length === 0) {
      return ['Hamid', 'Oussama', 'Kamel'];
    }
    return data.map((p: any) => p.name);
  } catch {
    return ['Hamid', 'Oussama', 'Kamel'];
  }
}

// ── 18. Dynamic Caller Profiles & Team Applications Actions ──────────────────
export async function logAuditEvent(callerName: string, actionType: string, details: string, leadId?: number) {
  try {
    const session = await requireCallerSession();
    const supabase = requireSupabase();
    await supabase.from('audit_logs').insert({
      caller_name: session.name,
      action_type: actionType,
      details,
      lead_id: leadId
    });
    return { success: true };
  } catch (error: any) {
    console.error('[logAuditEvent Error]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getAuditLogs() {
  try {
    await requireAdminSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { success: true, logs: data || [] };
  } catch (error: any) {
    console.error('[getAuditLogs Error]', error.message);
    return { success: false, error: error.message, logs: [] };
  }
}

export async function getCallerProfiles() {
  try {
    if (!(await hasPortalSession())) throw new Error('UNAUTHORIZED');
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('caller_profiles').select('name, gender, role, daily_call_target, weekly_appointment_target').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    
    // Fallback if table is empty
    if (!data || data.length === 0) {
      return {
        success: true,
        profiles: [
          { name: 'Hamid', gender: 'Male', role: 'Admin', daily_call_target: 80, weekly_appointment_target: 15 },
          { name: 'Oussama', gender: 'Male', role: 'Caller', daily_call_target: 80, weekly_appointment_target: 15 },
          { name: 'Kamel', gender: 'Male', role: 'Caller', daily_call_target: 80, weekly_appointment_target: 15 }
        ]
      };
    }
    return { success: true, profiles: data };
  } catch (error: any) {
    console.error('[getCallerProfiles]', error.message);
    return {
      success: true,
      dbOffline: true,
      profiles: [
        { name: 'Hamid', gender: 'Male', role: 'Admin', daily_call_target: 80, weekly_appointment_target: 15 },
        { name: 'Oussama', gender: 'Male', role: 'Caller', daily_call_target: 80, weekly_appointment_target: 15 },
        { name: 'Kamel', gender: 'Male', role: 'Caller', daily_call_target: 80, weekly_appointment_target: 15 }
      ]
    };
  }
}

export async function verifyCallerPinAction(name: string, pin: string) {
  try {
    if (!(await hasPortalSession())) throw new Error('UNAUTHORIZED');
    const supabase = requireSupabase();
    
    // Check custom profiles first
    const { data, error } = await supabase
      .from('caller_profiles')
      .select('pin, role')
      .eq('name', name)
      .single();
      
    if (!error && data) {
      if (verifyCallerPin(data.pin, pin)) {
        if (!data.pin.startsWith(`${PIN_HASH_PREFIX}$`)) {
          const { error: upgradeError } = await supabase
            .from('caller_profiles')
            .update({ pin: hashCallerPin(pin) })
            .eq('name', name);
          if (upgradeError) {
            console.warn('[verifyCallerPinAction] Unable to upgrade legacy caller PIN hash:', upgradeError.message);
          }
        }
        const role = (data.role || 'Caller') as CallerRole;
        await setCallerSession(name, role);
        return { success: true, role };
      }
      return { success: false };
    }
    
    // Fallback to env variables if not found in DB
    let expectedPin = '';
    let role = 'Caller';
    if (name === 'Hamid') {
      expectedPin = (process.env.HAMID_PIN || '').trim();
      role = 'Admin';
    } else if (name === 'Oussama') {
      expectedPin = (process.env.OUSSAMA_PIN || '').trim();
      role = 'Caller';
    } else if (name === 'Kamel') {
      expectedPin = (process.env.KAMEL_PIN || '').trim();
      role = 'Caller';
    }
    
    const matched = expectedPin !== '' && safeStringEqual(expectedPin, pin);
    if (matched) await setCallerSession(name, role as CallerRole);
    return { success: matched, role: matched ? role : undefined };
  } catch (error: any) {
    console.error('[verifyCallerPinAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function submitTeamApplication(name: string, email: string, phone: string, gender: string) {
  try {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedGender = gender.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) throw new Error('INVALID_NAME');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('INVALID_EMAIL_FORMAT');
    if (normalizedPhone.length < 6 || normalizedPhone.length > 50) throw new Error('INVALID_PHONE');
    if (!['Male', 'Female', 'Other'].includes(normalizedGender)) throw new Error('INVALID_GENDER');

    const supabase = requireSupabase();
    const { data: existing, error: existingError } = await supabase
      .from('team_applications')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('status', 'Pending')
      .limit(1);
    if (existingError) throw new Error(existingError.message);
    if (existing?.length) throw new Error('APPLICATION_ALREADY_PENDING');

    const { error } = await supabase.from('team_applications').insert({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      gender: normalizedGender,
      status: 'Pending'
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('[submitTeamApplication]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getTeamApplications() {
  try {
    await requireAdminSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('team_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { success: true, applications: data || [] };
  } catch (error: any) {
    console.error('[getTeamApplications]', error.message);
    return { success: false, error: error.message, applications: [] };
  }
}

export async function handleApplicationDecision(applicationId: number, status: 'Accepted' | 'Rejected', pin?: string) {
  try {
    await requireAdminSession();
    const supabase = requireSupabase();
    
    // 1. Fetch application details
    const { data: app, error: fetchErr } = await supabase
      .from('team_applications')
      .select('*')
      .eq('id', applicationId)
      .single();
      
    if (fetchErr || !app) throw new Error(fetchErr?.message || 'Application not found');
    
    // 2. If accepted, create the caller profile before marking the application accepted.
    if (status === 'Accepted') {
      if (!pin) throw new Error('PIN is required for caller creation.');
      const { error: profileErr } = await supabase
        .from('caller_profiles')
        .insert({
          name: app.name,
          pin: hashCallerPin(pin),
          gender: app.gender
        });
      if (profileErr) throw new Error(profileErr.message);
    }

    // 3. Update application status only after all prerequisites succeed.
    const { error: updateErr } = await supabase
      .from('team_applications')
      .update({ status })
      .eq('id', applicationId);
    if (updateErr) throw new Error(updateErr.message);
    
    return { success: true };
  } catch (error: any) {
    console.error('[handleApplicationDecision]', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCallerProfile(name: string) {
  try {
    await requireAdminSession();
    if (name === 'Hamid') {
      throw new Error('ADMIN_CANNOT_BE_DELETED');
    }
    const supabase = requireSupabase();
    
    // 1. Delete the profile row
    const { error } = await supabase
      .from('caller_profiles')
      .delete()
      .eq('name', name);
    if (error) throw new Error(error.message);
    
    // 2. Unassign active uncalled leads assigned to this caller
    const { error: unassignErr } = await supabase
      .from('leads')
      .update({ assigned_to: null })
      .eq('assigned_to', name)
      .or(ACTIVE_ASSIGNMENT_FILTER);
      
    if (unassignErr) {
      console.warn('[deleteCallerProfile unassign warning]', unassignErr.message);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[deleteCallerProfile]', error.message);
    return { success: false, error: error.message };
  }
}

export async function verifyPortalPinAction(pin: string) {
  try {
    const expectedPortalPin = (process.env.PORTAL_PIN || '').trim();
    if (!expectedPortalPin) throw new Error('PORTAL_PIN_NOT_CONFIGURED');
    const success = safeStringEqual(expectedPortalPin, pin);
    if (success) await setPortalSession();
    return { success };
  } catch (error: any) {
    console.error('[verifyPortalPinAction]', error.message);
    return { success: false, error: error.message };
  }
}

async function getAllLeadDuplicateFields(supabase: any) {
  const rows: any[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, agency_name, area, phone, phone_2, maps_link, website')
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function getCurrentSessionAction() {
  try {
    const portalUnlocked = await hasPortalSession();
    const caller = await getCallerSession();
    return {
      success: true,
      portalUnlocked,
      callerName: caller?.name || '',
      callerRole: caller?.role || 'Caller',
    };
  } catch (error: any) {
    return { success: false, portalUnlocked: false, callerName: '', callerRole: 'Caller', error: error.message };
  }
}

export async function logoutAction() {
  await clearAuthSession();
  return { success: true };
}


// ── Phase 2: CSV Header Extraction ───────────────────────────────────────────
export async function extractCsvHeaders(csvText: string) {
  try {
    await requireAdminSession();
    const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 1) return { success: false, error: 'Empty file', headers: [] };
    const headers = parseCsvLine(lines[0]).map((h: string) => h.trim());
    return { success: true, headers };
  } catch (error: any) {
    return { success: false, error: error.message, headers: [] };
  }
}

// ── Phase 2: Preview with explicit column mapping ─────────────────────────────
export async function previewLeadImportWithMapping(csvText: string, columnMapping: Record<string, string>) {
  try {
    await requireAdminSession();
    const supabase = requireSupabase();
    const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) return { success: false, error: 'No data rows found.', preview: null };

    const rawHeaders = parseCsvLine(lines[0]).map((h: string) => h.trim());

    const parsedRows = lines.slice(1).map((line: string, idx: number) => {
      const values = parseCsvLine(line);
      const row: Record<string, any> = { row_number: idx + 2 };
      rawHeaders.forEach((header: string, i: number) => {
        const dbField = columnMapping[header];
        if (!dbField || dbField === 'skip') return;
        if (!IMPORTABLE_LEAD_FIELDS.includes(dbField)) return;
        const rawValue = values[i]?.trim() || '';
        if (!rawValue) return;
        if (['google_rating'].includes(dbField)) {
          row[dbField] = parseFloat(rawValue) || 0;
        } else if (['review_count', 'priority'].includes(dbField)) {
          row[dbField] = parseInt(rawValue, 10) || (dbField === 'priority' ? 3 : 0);
        } else {
          row[dbField] = rawValue;
        }
      });
      return row;
    }).filter((row: any) => row.agency_name || row.phone || row.maps_link);

    if (!parsedRows.length) return { success: false, error: 'No usable rows after mapping.', preview: null };

    const cleanPhone = (raw?: string): { normalized: string; display: string; warning: string | null } => {
      if (!raw) return { normalized: '', display: '', warning: 'Missing phone' };
      const stripped = raw.replace(/[\s\-().]/g, '');
      const digits = stripped.replace(/\D/g, '');
      if (!digits) return { normalized: '', display: raw, warning: 'Invalid phone format' };
      if (digits.length < 8) return { normalized: digits, display: raw, warning: 'Phone too short' };
      if (digits.length > 15) return { normalized: digits, display: raw, warning: 'Phone too long' };
      let normalized = digits;
      if (digits.startsWith('0') && digits.length === 10) {
        normalized = '213' + digits.substring(1);
      }
      const display = digits.startsWith('0') ? digits : ('+' + normalized);
      return { normalized, display, warning: null };
    };

    const existingRows = await getAllLeadDuplicateFields(supabase);
    const seenKeys = new Set<string>();

    const rows = parsedRows.map((row: any) => {
      const reasons: string[] = [];
      const warnings: string[] = [];
      if (!row.agency_name) warnings.push('Missing business name');
      if (!row.phone && !row.maps_link && !row.website) warnings.push('Missing phone/maps/website');
      const phoneResult = cleanPhone(row.phone);
      if (phoneResult.warning) warnings.push(phoneResult.warning);
      const pn = phoneResult.normalized;
      const mapN = normalizeForDuplicate(row.maps_link);
      const agencyArea = `${normalizeForDuplicate(row.agency_name)}|${normalizeForDuplicate(row.area)}`;
      if (pn && existingRows.some((l: any) => normalizePhoneValues(l.phone).includes(pn) || normalizePhoneValues(l.phone_2).includes(pn))) reasons.push('Duplicate phone in DB');
      if (mapN && existingRows.some((l: any) => normalizeForDuplicate(l.maps_link) === mapN)) reasons.push('Duplicate maps_link');
      if (row.agency_name && row.area && existingRows.some((l: any) => `${normalizeForDuplicate(l.agency_name)}|${normalizeForDuplicate(l.area)}` === agencyArea)) reasons.push('Duplicate name+area');
      const key = pn || mapN || agencyArea;
      if (key && seenKeys.has(key)) reasons.push('Duplicate in file');
      if (key) seenKeys.add(key);
      return { ...row, phone_display: phoneResult.display || row.phone, phone_normalized: phoneResult.normalized, priority: row.priority || 3, call_status: 'Not Called', duplicate_reasons: reasons, warnings, importable: reasons.length === 0 };
    });

    return {
      success: true,
      preview: {
        total_rows: rows.length,
        importable_rows: rows.filter((r: any) => r.importable).length,
        skipped_rows: rows.filter((r: any) => !r.importable).length,
        warning_rows: rows.filter((r: any) => r.warnings.length > 0).length,
        rows,
      },
    };
  } catch (error: any) {
    console.error('[previewLeadImportWithMapping]', error.message);
    return { success: false, error: error.message, preview: null };
  }
}

// ── Phase 2: Deal Pipeline Actions ────────────────────────────────────────────

export async function getDeals() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
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
    const { data, error } = await supabase.from('deals').insert([{
      deal_name: params.deal_name,
      company_name: params.company_name || '',
      caller_name: session.name,
      lead_id: params.lead_id || null,
      stage: 'New',
      setup_value: params.setup_value || 0,
      recurring_value: params.recurring_value || 0,
      expected_close_date: params.expected_close_date || null,
      notes: params.notes || '',
    }]).select().single();
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'CREATE_DEAL', `Created deal: ${params.deal_name}`, params.lead_id);
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
    const payload: Record<string, any> = { stage: newStage, updated_at: new Date().toISOString() };
    if (lostReason) payload.lost_reason = lostReason;
    const { error } = await supabase.from('deals').update(payload).eq('id', dealId);
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'UPDATE_DEAL_STAGE', `Deal #${dealId} → ${newStage}`);
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
    const { error } = await supabase.from('deals').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', dealId);
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'EDIT_DEAL', `Edited deal #${dealId}`);
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
    await logAuditEvent(session.name, 'DELETE_DEAL', `Deleted deal #${dealId}`);
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
    const { data, error } = await supabase.from('caller_profiles').select('daily_call_target, weekly_appointment_target').eq('name', effectiveCallerName).single();
    if (error) throw new Error(error.message);

    // Count calls made today by this caller
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await supabase
      .from('call_history')
      .select('id', { count: 'exact', head: true })
      .eq('caller_name', effectiveCallerName)
      .gte('created_at', startOfToday.toISOString());
    if (countErr) throw new Error(countErr.message);

    return {
      success: true,
      daily_call_target: data?.daily_call_target ?? 80,
      weekly_appointment_target: data?.weekly_appointment_target ?? 15,
      calls_today: count ?? 0
    };
  } catch (error: any) {
    return { success: false, error: error.message, daily_call_target: 80, weekly_appointment_target: 15, calls_today: 0 };
  }
}
