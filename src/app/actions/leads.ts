'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { broadcastSse } from '@/lib/sse-broker';
import {
  requireCallerSession,
  requireWritableSession,
} from '@/lib/auth-session';
import { ALLOWED_CALL_STATUSES } from '@/lib/constants';
import { GoogleGenerativeAI } from '@google/generative-ai';

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

const CONVERTED_STATUSES = ['Accepted', 'Client Configured'];
const WARM_STATUSES = ['Interested'];
const FOLLOWUP_STATUSES = ['Callback', 'Busy', 'No Answer'];
const TREATED_STATUSES = ['Treated'];

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
  'services'
].join(',');

function escapePostgrestFilterValue(value: string) {
  return value.replace(/[(),.%]/g, char => `\\${char}`);
}

function assertAllowedCallStatus(status: string) {
  if (!(ALLOWED_CALL_STATUSES as readonly string[]).includes(status)) {
    throw new Error('INVALID_CALL_STATUS');
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
      // Correct Filter: exclude Lost leads only so other states remain visible
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
    console.error('[getLeads]', error.message);
    return { success: false, error: error.message, leads: [], total: 0 };
  }
}

export async function getDialerQueue() {
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
      const safeCaller = escapePostgrestFilterValue(effectiveCallerName);
      // Concurrency lock check: caller can access leads assigned directly to them, completely unassigned leads, or leads whose lock has expired (updated > 10 mins ago)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      q = q.or(`assigned_to.eq.${safeCaller},assigned_to.is.null,last_updated.lt.${tenMinutesAgo}`);
    }

    const { data, count, error } = await q
      .order('priority', { ascending: true })
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .order('review_count', { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, queue: data || [], total: count || (data || []).length };
  } catch (error: any) {
    console.error('[getDialerQueue]', error.message);
    return { success: false, error: error.message, queue: [] };
  }
}

async function syncDealFromCallStatus(supabase: any, leadId: number, status: string, agencyName: string, callerName: string) {
  // Map call_status to deal stage
  let stage: string | null = null;
  if (status === 'Interested') stage = 'Interested';
  else if (status === 'Callback') stage = 'Appointment Booked';
  else if (['Accepted', 'Client Configured'].includes(status)) stage = 'Won';
  else if (['Not Interested', 'Wrong Number'].includes(status)) stage = 'Lost';
  else if (['Busy', 'No Answer', 'Treated'].includes(status)) stage = 'Contacted';

  if (!stage) return; // For un-contacted statuses, do not create pipeline entries

  // Check if deal already exists for this lead_id
  const { data: existingDeal, error: dealFetchErr } = await supabase
    .from('deals')
    .select('id, stage')
    .eq('lead_id', leadId)
    .maybeSingle();

  if (dealFetchErr) {
    console.error('[syncDealFromCallStatus fetch error]', dealFetchErr.message);
    return;
  }

  if (existingDeal) {
    const { error: updateErr } = await supabase
      .from('deals')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', existingDeal.id);
    if (updateErr) {
      console.error('[syncDealFromCallStatus update error]', updateErr.message);
    }
  } else {
    // Automatically create deals for any status mapped to a valid pipeline stage
    const { error: insertErr } = await supabase
      .from('deals')
      .insert({
        deal_name: `${agencyName || 'Leads'} Deal`,
        company_name: agencyName || '',
        caller_name: callerName,
        lead_id: leadId,
        stage,
        setup_value: 0.00,
        recurring_value: 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    if (insertErr) {
      console.error('[syncDealFromCallStatus insert error]', insertErr.message);
    }
  }
}

export async function updateCallStatus(
  id: number,
  status: string,
  notes: string,
  callNotes: string,
  callerName: string,
  meetingDate?: string,
  contactPerson?: string | null,
  email?: string | null
) {
  try {
    const session = await requireWritableSession();
    assertAllowedCallStatus(status);
    const supabase = requireSupabase();

    const { data: original, error: fetchErr } = await supabase
      .from('leads')
      .select('agency_name, call_status, notes, call_notes, caller_name, assigned_to, last_called_at, last_updated, meeting_date')
      .eq('id', id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    if (original.assigned_to && original.assigned_to !== session.name) {
      const lockExpired = original.last_updated && (Date.now() - new Date(original.last_updated).getTime() > 10 * 60 * 1000);
      if (!lockExpired) {
        throw new Error('LEAD_ASSIGNED_TO_OTHER');
      }
    }
    
    const updatePayload: any = {
      call_status: status,
      notes,
      call_notes: callNotes,
      caller_name: session.name,
      assigned_to: session.name,
      last_called_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    if (meetingDate !== undefined) {
      updatePayload.meeting_date = meetingDate;
    }
    if (contactPerson !== undefined) {
      updatePayload.contact_person = contactPerson;
    }
    if (email !== undefined) {
      updatePayload.email = email;
    }

    // Auto-release lock if status is Lost
    if (['Not Interested', 'Wrong Number'].includes(status)) {
      updatePayload.assigned_to = null;
    }

    const { error } = await supabase.from('leads').update(updatePayload).eq('id', id);
    if (error) throw new Error(error.message);

    // Broadcast SSE status change & lock release
    broadcastSse('STATUS_CHANGED', { leadId: id, status, user: session.name });
    if (['Not Interested', 'Wrong Number'].includes(status)) {
      broadcastSse('LOCK_RELEASED', { leadId: id, user: session.name });
    }

    // Insert history record
    const { error: historyError } = await supabase.from('call_history').insert({
      lead_id: id,
      caller_name: session.name,
      call_status: status,
      notes: callNotes || notes
    });
    if (historyError) throw new Error(historyError.message);

    // Synchronize deal to pipeline
    await syncDealFromCallStatus(supabase, id, status, original.agency_name, session.name);

    return { success: true };
  } catch (error: any) {
    console.error('[updateCallStatus]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateLeadDetails(id: number, fields: any) {
  try {
    const session = await requireWritableSession();
    if (fields.call_status) assertAllowedCallStatus(fields.call_status);
    const supabase = requireSupabase();

    const { data: currentLead, error: fetchErr } = await supabase
      .from('leads')
      .select('assigned_to, agency_name, call_status')
      .eq('id', id)
      .single();

    if (fetchErr || !currentLead) throw new Error(fetchErr?.message || 'LEAD_NOT_FOUND');

    if (session.role !== 'Admin') {
      if (currentLead.assigned_to && currentLead.assigned_to !== session.name) {
        throw new Error('LEAD_ASSIGNED_TO_OTHER');
      }
    }

    // Field Formats Validation
    if (fields.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
        throw new Error('INVALID_EMAIL_FORMAT');
      }
    }
    if (fields.priority) {
      const p = Number(fields.priority);
      if (isNaN(p) || p < 1 || p > 5) throw new Error('INVALID_PRIORITY_RANGE');
    }

    const finalFields = { ...fields };
    const { error } = await supabase.from('leads').update({
      ...finalFields,
      last_updated: new Date().toISOString(),
    }).eq('id', id);

    if (error) throw new Error(error.message);

    // Sync deal to pipeline if call status has changed
    if (fields.call_status && fields.call_status !== currentLead.call_status) {
      await syncDealFromCallStatus(
        supabase, 
        id, 
        fields.call_status, 
        fields.agency_name || currentLead.agency_name, 
        session.name
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateLeadDetails]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getAnalytics() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    
    const [totalRes, todayRes, interestedRes, acceptedRes, configuredRes, callbackRes, notInterestedRes, wrongNumberRes, noAnswerRes, busyRes] = await Promise.all([
      supabase.from('leads').select('id', { count: 'planned', head: true }),
      supabase.from('leads').select('id', { count: 'planned', head: true }).gte('last_called_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
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
        }
      }
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
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Interested'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).in('call_status', ['Accepted', 'Client Configured']),
      supabase.from('leads').select('id', { count: 'exact', head: true }).in('call_status', ['Callback', 'Busy', 'No Answer']),
      supabase.from('leads').select('id', { count: 'exact', head: true }).in('call_status', ['Not Interested', 'Wrong Number']),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Treated'),
    ]);

    return {
      success: true,
      counts: {
        total: totalRes.count || 0,
        warm: warmRes.count || 0,
        converted: convertedRes.count || 0,
        followups: followupRes.count || 0,
        lost: lostRes.count || 0,
        treated: treatedRes.count || 0,
      }
    };
  } catch (error: any) {
    console.error('[getTargetInventoryCounts]', error.message);
    return { success: false, error: error.message, counts: null };
  }
}

export async function processCallSummaryWithAI(rawText: string) {
  await requireWritableSession();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY_MISSING', extractedData: { call_status: 'Callback', meeting_date: null, contact_person: null, updated_email: null, summary: rawText } };
  }

  const prompt = `You are an intelligent assistant analyzing Algerian travel agency cold call notes.
Analyze this raw note: """${rawText}"""
Respond ONLY with a valid JSON object:
{
  "call_status": "Interested" | "Accepted" | "Callback" | "Not Interested" | "Wrong Number" | "No Answer",
  "meeting_date": "scheduled date/time string" or null,
  "contact_person": "name of contact" or null,
  "updated_email": "email address if mentioned" or null,
  "summary": "clean 1-sentence English summary"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 250,
        responseMimeType: 'application/json',
      },
    });
    const textResult = result.response.text() || '{}';
    return { success: true, extractedData: JSON.parse(textResult.trim()) };
  } catch (error: any) {
    return { success: false, error: error.message, extractedData: { call_status: 'Callback', meeting_date: null, contact_person: null, updated_email: null, summary: 'Error: ' + rawText } };
  }
}

export async function generatePitchWithAI(options: {
  agencyName: string;
  website?: string;
  websiteQuality?: string;
  area?: string;
  callerName: string;
  customInstruction?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  socialLink?: string;
  followers?: string;
  facebookFollowers?: string;
  instagramFollowers?: string;
  runningAds?: string;
}) {
  await requireWritableSession();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: 'GEMINI_API_KEY_MISSING' };

  const isNoWeb = !options.website || options.website === 'Not found' || options.website.toLowerCase() === 'none';

  const hasSocials = options.facebook || options.instagram || options.tiktok || options.linkedin || options.socialLink;
  const followersDesc = [
    options.followers ? `Général: ${options.followers}` : '',
    options.facebookFollowers ? `Facebook: ${options.facebookFollowers}` : '',
    options.instagramFollowers ? `Instagram: ${options.instagramFollowers}` : '',
  ].filter(Boolean).join(', ');

  const basePrompt = `Rédige un message d'accroche personnalisé et très court (maximum 3 phrases) en français, chaleureux et persuasif, destiné à une agence de voyages en Algérie pour lui proposer de créer ou d'optimiser son site web. Présente-toi au nom de l'agence "Castarokio Digital" et fais référence de manière pertinente à leur activité pour justifier l'intérêt de collaborer avec nous, en proposant de jeter un coup d'œil à notre portfolio (https://castarokio.github.io/).

Agence : ${options.agencyName}
Ville : ${options.area || 'Algérie'}
Site existant : ${isNoWeb ? "Non (pas de site, réseaux sociaux uniquement)" : `Oui (${options.website})`}
Qualité site : ${options.websiteQuality || 'Moyenne'}
Prospecteur : ${options.callerName}

Présence réseaux sociaux : ${hasSocials ? 'Oui' : 'Non'}
${options.facebook ? `Facebook : ${options.facebook}` : ''}
${options.instagram ? `Instagram : ${options.instagram}` : ''}
${options.tiktok ? `TikTok : ${options.tiktok}` : ''}
${followersDesc ? `Abonnés : ${followersDesc}` : ''}
${options.runningAds ? `Diffuse des publicités actuellement : ${options.runningAds}` : ''}

${options.customInstruction ? `Consignes supplémentaires : "${options.customInstruction}"` : ''}

Réponds UNIQUEMENT avec le texte brut du message généré.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: basePrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      },
    });
    const textResult = result.response.text() || '';
    return { success: true, pitch: textResult.trim() };
  } catch (error: any) {
    console.error('[generatePitchWithAI]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateCallStatusWithAI(leadId: number, callerName: string, rawSummary: string) {
  const session = await requireWritableSession();
  const aiRes = await processCallSummaryWithAI(rawSummary);
  if (!aiRes.success) return { success: false, error: aiRes.error };

  const data = aiRes.extractedData;
  assertAllowedCallStatus(data.call_status);

  try {
    const supabase = requireSupabase();

    // Fetch original lead agency name
    const { data: original, error: fetchErr } = await supabase
      .from('leads')
      .select('agency_name')
      .eq('id', leadId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    
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

    // Broadcast SSE status change & lock release
    broadcastSse('STATUS_CHANGED', { leadId, status: data.call_status, user: session.name });
    if (['Not Interested', 'Wrong Number'].includes(data.call_status)) {
      broadcastSse('LOCK_RELEASED', { leadId, user: session.name });
    }

    await supabase.from('call_history').insert({
      lead_id: leadId,
      caller_name: session.name,
      call_status: data.call_status,
      notes: data.summary || rawSummary
    });

    // Synchronize deal to pipeline
    await syncDealFromCallStatus(supabase, leadId, data.call_status, original.agency_name, session.name);

    return { success: true, extracted: data };
  } catch (error: any) {
    console.error('[updateCallStatusWithAI]', error.message);
    return { success: false, error: error.message };
  }
}

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

export async function deleteLeadPermanently(leadId: number) {
  try {
    await requireWritableSession();
    const supabase = requireSupabase();

    const { error: histErr } = await supabase.from('call_history').delete().eq('lead_id', leadId);
    if (histErr) throw new Error(histErr.message);

    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) throw new Error(error.message);

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
        call_notes: '',
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

export async function getLeadAreas() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('area')
      .not('area', 'is', null)
      .neq('area', '');
    if (error) throw new Error(error.message);

    const areas = Array.from(new Set<string>((data || []).map((r: any) => r.area.trim()))).sort();
    return { success: true, areas };
  } catch (error: any) {
    console.error('[getLeadAreas]', error.message);
    return { success: false, error: error.message, areas: [] };
  }
}

export async function lockLead(leadId: number, callerName: string) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    
    // Acquire optimistic lock in database, ensuring it hasn't been handled yet and lock is free or expired
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('leads')
      .update({
        assigned_to: session.name,
        last_updated: new Date().toISOString()
      })
      .eq('id', leadId)
      .or('call_status.eq.Not Called,call_status.is.null,call_status.eq.Recalled')
      .or(`assigned_to.is.null,assigned_to.eq.${session.name},last_updated.lt.${tenMinutesAgo}`)
      .select('id');

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { success: false, error: 'LEAD_LOCKED_BY_OTHER' };

    // Broadcast SSE lock
    broadcastSse('LOCK_ACQUIRED', { leadId, user: session.name });

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
        assigned_to: null,
        last_updated: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('assigned_to', session.name);

    if (error) throw new Error(error.message);

    // Broadcast SSE unlock
    broadcastSse('LOCK_RELEASED', { leadId, user: session.name });

    return { success: true };
  } catch (error: any) {
    console.error('[unlockLead]', error.message);
    return { success: false, error: error.message };
  }
}

export async function recallLead(leadId: number) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update({
        call_status: 'Recalled',
        assigned_to: session.name,
        last_updated: now
      })
      .eq('id', leadId);

    if (error) throw new Error(error.message);

    await supabase.from('call_history').insert({
      lead_id: leadId,
      caller_name: session.name,
      call_status: 'Recalled',
      notes: 'Lead recalled and pushed to calling queue.'
    });

    // Broadcast SSE lock & status change
    broadcastSse('LOCK_ACQUIRED', { leadId, user: session.name });
    broadcastSse('STATUS_CHANGED', { leadId, status: 'Recalled', user: session.name });

    return { success: true };
  } catch (error: any) {
    console.error('[recallLead]', error.message);
    return { success: false, error: error.message };
  }
}

export async function createLeadAction(leadData: {
  agency_name: string;
  area: string;
  phone: string;
  phone_2?: string | null;
  email?: string | null;
  email_2?: string | null;
  website?: string | null;
  website_quality?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  social_link?: string | null;
  google_rating?: number | null;
  review_count?: number | null;
  address?: string | null;
  notes?: string | null;
  priority?: number | null;
}) {
  try {
    const session = await requireWritableSession();
    const supabase = requireSupabase();
    
    const calculatedPriority = leadData.priority || computeLeadPriority({
      website: leadData.website,
      facebook: leadData.facebook,
      instagram: leadData.instagram,
      review_count: leadData.review_count
    });

    const payload = {
      agency_name: leadData.agency_name,
      area: leadData.area,
      phone: leadData.phone,
      phone_2: leadData.phone_2 || null,
      email: leadData.email || null,
      email_2: leadData.email_2 || null,
      website: leadData.website || null,
      website_quality: leadData.website_quality || 'None',
      facebook: leadData.facebook || null,
      instagram: leadData.instagram || null,
      tiktok: leadData.tiktok || null,
      linkedin: leadData.linkedin || null,
      social_link: leadData.social_link || null,
      google_rating: leadData.google_rating ?? 0.0,
      review_count: leadData.review_count ?? 0,
      address: leadData.address || null,
      notes: leadData.notes || '',
      priority: calculatedPriority,
      call_status: 'Not Called',
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return { success: true, lead: data };
  } catch (error: any) {
    console.error('[createLeadAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function recallAllUnansweredAction(callerName: string) {
  try {
    const session = await requireWritableSession();
    const effectiveCallerName = session.role === 'Admin' || session.role === 'Supervisor' ? callerName : session.name;
    const supabase = requireSupabase();
    
    const { data: leadsToRecall, error: fetchErr } = await supabase
      .from('leads')
      .select('id')
      .eq('caller_name', effectiveCallerName)
      .in('call_status', ['Busy', 'No Answer']);
      
    if (fetchErr) throw new Error(fetchErr.message);
    if (!leadsToRecall || leadsToRecall.length === 0) {
      return { success: true, count: 0 };
    }
    
    const leadIds = leadsToRecall.map((l: any) => l.id);
    
    const { error: updateErr } = await supabase
      .from('leads')
      .update({
        call_status: 'Not Called',
        call_notes: '',
        caller_name: null,
        assigned_to: null,
        meeting_date: null,
        last_called_at: null,
        last_updated: new Date().toISOString()
      })
      .in('id', leadIds);
      
    if (updateErr) throw new Error(updateErr.message);
    
    for (const leadId of leadIds) {
      broadcastSse('STATUS_CHANGED', { leadId, status: 'Not Called', user: session.name });
      broadcastSse('LOCK_RELEASED', { leadId, user: session.name });
    }
    
    return { success: true, count: leadIds.length };
  } catch (error: any) {
    console.error('[recallAllUnansweredAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteLeadsAction(leadIds: number[]) {
  try {
    const session = await requireWritableSession();
    if (session.role !== 'Admin' && session.role !== 'Supervisor') {
      throw new Error('UNAUTHORIZED');
    }
    const supabase = requireSupabase();
    
    const { error: histErr } = await supabase
      .from('call_history')
      .delete()
      .in('lead_id', leadIds);
    if (histErr) throw new Error(histErr.message);

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', leadIds);
    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: any) {
    console.error('[bulkDeleteLeadsAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function bulkRestoreLeadsAction(leadIds: number[]) {
  try {
    await requireWritableSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('leads')
      .update({
        call_status: 'Not Called',
        call_notes: '',
        caller_name: null,
        assigned_to: null,
        meeting_date: null,
        last_called_at: null,
        last_updated: new Date().toISOString(),
      })
      .in('id', leadIds);
    if (error) throw new Error(error.message);
    
    for (const leadId of leadIds) {
      broadcastSse('LOCK_RELEASED', { leadId, user: 'system' });
      broadcastSse('STATUS_CHANGED', { leadId, status: 'Not Called', user: 'system' });
    }

    return { success: true };
  } catch (error: any) {
    console.error('[bulkRestoreLeadsAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getUpcomingCallbacksAction(callerName: string) {
  try {
    const session = await requireCallerSession();
    const effectiveCallerName = session.role === 'Admin' || session.role === 'Supervisor' ? callerName : session.name;
    const supabase = requireSupabase();

    const { data, error } = await supabase
      .from('leads')
      .select('id, agency_name, meeting_date, call_notes')
      .eq('call_status', 'Callback')
      .or(`assigned_to.eq.${escapePostgrestFilterValue(effectiveCallerName)},caller_name.eq.${escapePostgrestFilterValue(effectiveCallerName)}`)
      .not('meeting_date', 'is', null);

    if (error) throw new Error(error.message);

    return { success: true, callbacks: data || [] };
  } catch (error: any) {
    console.error('[getUpcomingCallbacksAction]', error.message);
    return { success: false, error: error.message, callbacks: [] };
  }
}

export async function getSingleLeadAction(leadId: number) {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select(LEAD_LIST_COLUMNS)
      .eq('id', leadId)
      .single();
    if (error) throw new Error(error.message);
    return { success: true, lead: data };
  } catch (error: any) {
    console.error('[getSingleLeadAction]', error.message);
    return { success: false, error: error.message };
  }
}
