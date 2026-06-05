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

export const MOCK_DEMO_LEADS = [
  {
    id: 9001,
    agency_name: "Sahara Odyssey Travel",
    phone: "029123456",
    phone_2: "0550111222",
    email: "info@sahara-odyssey.dz",
    email_2: "booking@sahara-odyssey.dz",
    website: "www.sahara-odyssey.dz",
    area: "Biskra",
    address: "12 Blvd des Martyrs, Biskra",
    priority: 1,
    call_status: "Not Called",
    call_notes: "",
    last_called_at: null,
    facebook: "facebook.com/sahara.odyssey",
    instagram: "instagram.com/sahara.odyssey",
    social_link: "tiktok.com/@sahara.odyssey",
    review_count: 342,
    rating: 4.8,
    details: "Followers: FB: 25.4K | IG: 18.2K | Reviews: 342",
    contact_person: "Mourad Belkacem",
    assigned_to: "Demo Caller",
    website_quality: "Poor",
    google_rating: 4.8,
    followers_if_visible: "25k",
    facebook_followers: 25400,
    instagram_followers: 18200,
    running_ads: false,
    services: "Sahara Trekking, Biskra Tours, Camel Riding"
  },
  {
    id: 9002,
    agency_name: "Algerian Oasis Voyages",
    phone: "029876543",
    phone_2: "0661333444",
    email: "contact@algerian-oasis.com",
    email_2: "",
    website: "",
    area: "Ghardaia",
    address: "Palmeraie Road, Ghardaia",
    priority: 2,
    call_status: "Interested",
    call_notes: "Very interested in the professional package to display tour packages. Owner wants callback tomorrow afternoon.",
    last_called_at: new Date(Date.now() - 3600000).toISOString(),
    facebook: "facebook.com/algerianoasis",
    instagram: "instagram.com/algerian_oasis",
    social_link: "",
    review_count: 124,
    rating: 4.5,
    details: "Followers: FB: 12.1K | IG: 6.5K | Reviews: 124",
    contact_person: "Samia Brahimi",
    assigned_to: "Demo Caller",
    website_quality: "None",
    google_rating: 4.5,
    followers_if_visible: "12k",
    facebook_followers: 12100,
    instagram_followers: 6500,
    running_ads: false,
    services: "Mzab Valley Tours, Ghardaia Hotels"
  },
  {
    id: 9003,
    agency_name: "Djurdjura Adventure Tours",
    phone: "026445566",
    phone_2: "0770555666",
    email: "djurdjura@travel-dz.com",
    email_2: "",
    website: "www.djurdjura-adventure.dz",
    area: "Tizi Ouzou",
    address: "Route de la Grande Kabylie, Tizi Ouzou",
    priority: 1,
    call_status: "Not Called",
    call_notes: "",
    last_called_at: null,
    facebook: "facebook.com/djurdjura.adventure",
    instagram: "instagram.com/djurdjura.tours",
    social_link: "",
    review_count: 88,
    rating: 4.2,
    details: "Followers: FB: 9.8K | IG: 3.1K | Reviews: 88",
    contact_person: "Lounes Ait",
    assigned_to: "Demo Caller",
    website_quality: "Poor",
    google_rating: 4.2,
    followers_if_visible: "9k",
    facebook_followers: 9800,
    instagram_followers: 3100,
    running_ads: true,
    services: "Hiking Kabylie, Tikjda Skiing, Guest Houses"
  },
  {
    id: 9004,
    agency_name: "Oran Marina Flight & Travel",
    phone: "041778899",
    phone_2: "0555888999",
    email: "oran.marina@gmail.com",
    email_2: "",
    website: "",
    area: "Oran",
    address: "Front de Mer, Oran",
    priority: 3,
    call_status: "Busy",
    call_notes: "Called twice, line was busy. Will retry later.",
    last_called_at: new Date(Date.now() - 7200000).toISOString(),
    facebook: "facebook.com/oran.marina.travel",
    instagram: "",
    social_link: "",
    review_count: 51,
    rating: 3.9,
    details: "Followers: FB: 4.5K | Reviews: 51",
    contact_person: "Fouad Benzine",
    assigned_to: "Demo Caller",
    website_quality: "None",
    google_rating: 3.9,
    followers_if_visible: "4k",
    facebook_followers: 4500,
    instagram_followers: 0,
    running_ads: false,
    services: "Andalouses Beach Tours, Oran City Guides"
  },
  {
    id: 9005,
    agency_name: "Algiers Horizon Luxury Voyages",
    phone: "021998877",
    phone_2: "0660777888",
    email: "booking@algiers-horizon.dz",
    email_2: "corporate@algiers-horizon.dz",
    website: "www.algiers-horizon.dz",
    area: "Algiers",
    address: "45 Rue Didouche Mourad, Algiers",
    priority: 1,
    call_status: "Accepted",
    call_notes: "Deposit paid! starter package. Setting up design templates.",
    last_called_at: new Date(Date.now() - 86400000).toISOString(),
    facebook: "facebook.com/algiers.horizon",
    instagram: "instagram.com/algiers.horizon",
    social_link: "",
    review_count: 521,
    rating: 4.9,
    details: "Followers: FB: 42.6K | IG: 35.1K | Reviews: 521",
    contact_person: "Yacine Merah",
    assigned_to: "Demo Caller",
    website_quality: "Good",
    google_rating: 4.9,
    followers_if_visible: "42k",
    facebook_followers: 42600,
    instagram_followers: 35100,
    running_ads: true,
    services: "Turkey Packages, Flight Ticketing, Visa assistance"
  }
];

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
    const session = await requireCallerSession();
    
    if (session.name === 'Demo Caller') {
      let filtered = [...MOCK_DEMO_LEADS];
      if (search) {
        const s = search.toLowerCase().trim();
        // Support ID search (e.g. #9001)
        if (s.startsWith('#')) {
          const idVal = parseInt(s.substring(1).trim(), 10);
          filtered = filtered.filter(l => l.id === idVal);
        } else {
          filtered = filtered.filter(l => 
            l.agency_name.toLowerCase().includes(s) ||
            l.area.toLowerCase().includes(s) ||
            l.phone.includes(s) ||
            (l.contact_person && l.contact_person.toLowerCase().includes(s))
          );
        }
      }
      if (status) {
        filtered = filtered.filter(l => l.call_status === status);
      }
      if (priority) {
        filtered = filtered.filter(l => l.priority === parseInt(priority, 10));
      }
      if (area) {
        filtered = filtered.filter(l => l.area.toLowerCase().includes(area.toLowerCase()));
      }
      if (excludeLost) {
        filtered = filtered.filter(l => l.call_status !== 'Refused' && l.call_status !== 'Not Interested');
      }
      return { success: true, leads: filtered.slice(offset, offset + limit), total: filtered.length };
    }

    const supabase = requireSupabase();
    
    // Auto-expire old locks
    await runAutoExpirations();
    let q = supabase.from('leads').select(LEAD_LIST_COLUMNS, { count: 'exact' });

    let isIdSearch = false;
    if (search) {
      const trimmedSearch = search.trim();
      if (trimmedSearch.startsWith('#')) {
        const idString = trimmedSearch.substring(1).trim();
        const leadId = parseInt(idString, 10);
        if (!isNaN(leadId) && /^\d+$/.test(idString)) {
          q = q.eq('id', leadId);
          isIdSearch = true;
        } else {
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
      } else {
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
    }

    if (!isIdSearch) {
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
    }

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
    
    if (effectiveCallerName === 'Demo Caller') {
      const queue = MOCK_DEMO_LEADS.filter(l => l.call_status !== 'Accepted');
      return { success: true, queue, total: queue.length };
    }

    const supabase = requireSupabase();
    
    // Auto-expire old locks
    await runAutoExpirations();

    // Secure database exports: simple callers can ONLY query their active lock lead
    if (session.role === 'Caller') {
      const nowStr = new Date().toISOString();
      const { data: activeLock } = await supabase
        .from('lead_locks')
        .select('lead_id')
        .eq('locked_by', effectiveCallerName)
        .eq('lock_type', 'active_call')
        .eq('status', 'Active')
        .gt('lock_expiry', nowStr)
        .maybeSingle();

      if (activeLock) {
        const { data: lead } = await supabase
          .from('leads')
          .select(LEAD_LIST_COLUMNS)
          .eq('id', activeLock.lead_id)
          .single();
        return { success: true, queue: lead ? [lead] : [], total: lead ? 1 : 0 };
      }
      return { success: true, queue: [], total: 0 };
    }
    
    // Select leads that are fresh or explicitly recalled (Admins / Supervisors)
    let q = supabase
      .from('leads')
      .select(LEAD_LIST_COLUMNS, { count: 'exact' })
      .or('call_status.eq.Not Called,call_status.is.null,call_status.eq.Recalled');

    if (effectiveCallerName) {
      const safeCaller = escapePostgrestFilterValue(effectiveCallerName);
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
    if (session.name === 'Demo Caller') {
      return { success: true };
    }
    assertAllowedCallStatus(status);
    const supabase = requireSupabase();

    const { data: original, error: fetchErr } = await supabase
      .from('leads')
      .select('agency_name, call_status, notes, call_notes, caller_name, assigned_to, last_called_at, last_updated, meeting_date')
      .eq('id', id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    // Verify lock permissions via lead_locks table
    const { data: activeLock } = await supabase
      .from('lead_locks')
      .select('locked_by, lock_expiry')
      .eq('lead_id', id)
      .eq('lock_type', 'active_call')
      .eq('status', 'Active')
      .gt('lock_expiry', new Date().toISOString())
      .maybeSingle();

    if (activeLock && activeLock.locked_by !== session.name) {
      throw new Error('LEAD_LOCKED_BY_OTHER');
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

    const { error } = await supabase.from('leads').update(updatePayload).eq('id', id);
    if (error) throw new Error(error.message);

    // Manage locks leases
    const isProtected = ['Interested', 'Callback', 'Meeting Booked', 'Decision Maker Reached', 'Proposal Requested', 'Proposal Sent'].includes(status);
    if (isProtected) {
      await establishOwnershipLock(id, session.name);
    } else {
      await releaseActiveLock(id, session.name);
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
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('last_called_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Interested'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Accepted'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Client Configured'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Callback'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Not Interested'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Wrong Number'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'No Answer'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'Busy'),
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
  format?: 'whatsapp' | 'email';
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

  const isEmail = options.format === 'email';

  const basePrompt = isEmail
    ? `Rédige un e-mail professionnel d'accroche (cold email) personnalisé en français, chaleureux, structuré et persuasif, destiné à l'agence de voyages "${options.agencyName}" en Algérie.
Le but est de leur proposer de collaborer avec nous pour créer ou optimiser leur site web.
Présente-toi obligatoirement sous le nom de "hamid" de l'agence "Web-OS" (n'utilise aucun autre nom).
Fais référence de manière pertinente à leur activité et à leur présence en ligne pour justifier l'intérêt de collaborer.
Propose de jeter un coup d'œil à notre portfolio (https://castarokio.github.io/) et propose un court appel de 5 à 10 minutes ou un échange WhatsApp pour un audit complet gratuit de leur présence en ligne.
Termine par une signature professionnelle claire :
hamid — Web-OS
Tél/WhatsApp : +213 540 21 12 50
Email : castarokibusiness@gmail.com
Portfolio : https://castarokio.github.io/

Agence : ${options.agencyName}
Ville : ${options.area || 'Algérie'}
Site existant : ${isNoWeb ? "Non (pas de site, réseaux sociaux uniquement)" : `Oui (${options.website})`}
Qualité site : ${options.websiteQuality || 'Moyenne'}
Présence réseaux sociaux : ${hasSocials ? 'Oui' : 'Non'}
${options.facebook ? `Facebook : ${options.facebook}` : ''}
${options.instagram ? `Instagram : ${options.instagram}` : ''}
${options.tiktok ? `TikTok : ${options.tiktok}` : ''}
${followersDesc ? `Abonnés : ${followersDesc}` : ''}
${options.runningAds ? `Diffuse des publicités actuellement : ${options.runningAds}` : ''}

${options.customInstruction ? `Consignes supplémentaires : "${options.customInstruction}"` : ''}

Réponds UNIQUEMENT avec le texte brut de l'e-mail généré (pas de balises markdown, pas de sujet d'e-mail, uniquement le corps du message).`
    : `Rédige un message d'accroche personnalisé et très court (maximum 3 phrases) en français, chaleureux et persuasif, destiné à une agence de voyages en Algérie pour lui proposer de créer ou d'optimiser son site web. Présente-toi obligatoirement sous le nom de "hamid" de l'agence "Web-OS" (n'utilise aucun autre nom) et fais référence de manière pertinente à leur activité pour justifier l'intérêt de collaborer avec nous, en proposant de jeter un coup d'œil à notre portfolio (https://castarokio.github.io/).
  
Agence : ${options.agencyName}
Ville : ${options.area || 'Algérie'}
Site existant : ${isNoWeb ? "Non (pas de site, réseaux sociaux uniquement)" : `Oui (${options.website})`}
Qualité site : ${options.websiteQuality || 'Moyenne'}
Prospecteur : hamid

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: basePrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: isEmail ? 600 : 200,
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
  if (callerName === 'Demo Caller') return { success: true } as any;
  return acquireActiveLock(leadId, callerName);
}

export async function unlockLead(leadId: number, callerName: string) {
  if (callerName === 'Demo Caller') return { success: true } as any;
  return releaseActiveLock(leadId, callerName);
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
    
    if (effectiveCallerName === 'Demo Caller') {
      const minutesInMs = 5 * 60 * 1000;
      const callbackTime = new Date(Date.now() + minutesInMs);
      const timeStr = `${callbackTime.getFullYear()}-${String(callbackTime.getMonth() + 1).padStart(2, '0')}-${String(callbackTime.getDate()).padStart(2, '0')} ${String(callbackTime.getHours()).padStart(2, '0')}:${String(callbackTime.getMinutes()).padStart(2, '0')}`;
      
      return {
        success: true,
        callbacks: [
          {
            id: 9002,
            agency_name: "Algerian Oasis Voyages",
            meeting_date: timeStr,
            call_notes: "Owner requested callback about website packages."
          }
        ]
      };
    }

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

export async function acquireActiveLock(leadId: number, callerName: string) {
  try {
    const supabase = requireSupabase();
    const now = new Date();
    const nowStr = now.toISOString();
    const expiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes active lease

    // Check if active call lock exists and is still valid
    const { data: existingLock } = await supabase
      .from('lead_locks')
      .select('id, locked_by, lock_expiry')
      .eq('lead_id', leadId)
      .eq('lock_type', 'active_call')
      .eq('status', 'Active')
      .gt('lock_expiry', nowStr)
      .maybeSingle();

    if (existingLock) {
      if (existingLock.locked_by !== callerName) {
        return { success: false, error: 'LEAD_LOCKED_BY_OTHER', lockedBy: existingLock.locked_by };
      }
      // If it belongs to us, return success (we already hold it)
      return { success: true };
    }

    // Invalidate any other active locks for safety
    await supabase.from('lead_locks')
      .update({ status: 'Expired' })
      .eq('lead_id', leadId)
      .eq('lock_type', 'active_call')
      .eq('status', 'Active');

    // Insert new active call lock
    const { error: lockErr } = await supabase
      .from('lead_locks')
      .insert({
        lead_id: leadId,
        lock_type: 'active_call',
        locked_by: callerName,
        lock_expiry: expiry.toISOString(),
        status: 'Active'
      });

    if (lockErr) throw new Error(lockErr.message);

    // Update leads table to show lock owner
    await supabase.from('leads')
      .update({
        assigned_to: callerName,
        last_updated: nowStr
      })
      .eq('id', leadId);

    // Broadcast SSE status changed to trigger lock visualization
    broadcastSse('STATUS_CHANGED', { leadId, status: 'Locked for Call', user: callerName });

    return { success: true };
  } catch (error: any) {
    console.error('[acquireActiveLock]', error.message);
    return { success: false, error: error.message };
  }
}

export async function releaseActiveLock(leadId: number, callerName: string) {
  try {
    const supabase = requireSupabase();
    const nowStr = new Date().toISOString();

    // Release active lock in locks table
    await supabase.from('lead_locks')
      .update({ status: 'Released' })
      .eq('lead_id', leadId)
      .eq('lock_type', 'active_call')
      .eq('status', 'Active');

    // Check if the lead is currently owned (ownership lock)
    const { data: lead } = await supabase
      .from('leads')
      .select('owner_caller_id, call_status')
      .eq('id', leadId)
      .single();

    const updatePayload: any = { last_updated: nowStr };

    // If lead has a status like Interested, keep assigned_to. Otherwise release assigned_to.
    const isTreated = ['Interested', 'Callback', 'Meeting Booked', 'Accepted', 'Client Configured'].includes(lead?.call_status || '');
    if (!isTreated) {
      updatePayload.assigned_to = null;
    } else {
      updatePayload.assigned_to = lead.owner_caller_id || lead.assigned_to;
    }

    await supabase.from('leads').update(updatePayload).eq('id', leadId);

    broadcastSse('LOCK_RELEASED', { leadId, user: callerName });

    return { success: true };
  } catch (error: any) {
    console.error('[releaseActiveLock]', error.message);
    return { success: false, error: error.message };
  }
}

export async function establishOwnershipLock(leadId: number, callerName: string) {
  try {
    const supabase = requireSupabase();
    const now = new Date();
    const nowStr = now.toISOString();
    const expiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days ownership protection

    // Deactivate existing ownership locks on this lead
    await supabase.from('lead_locks')
      .update({ status: 'Released' })
      .eq('lead_id', leadId)
      .eq('lock_type', 'ownership')
      .eq('status', 'Active');

    // Create ownership lock
    const { error: lockErr } = await supabase
      .from('lead_locks')
      .insert({
        lead_id: leadId,
        lock_type: 'ownership',
        locked_by: callerName,
        lock_expiry: expiry.toISOString(),
        status: 'Active'
      });

    if (lockErr) throw new Error(lockErr.message);

    // Update lead attributes
    await supabase.from('leads')
      .update({
        owner_caller_id: callerName,
        ownership_status: 'Active',
        ownership_start_at: nowStr,
        ownership_expires_at: expiry.toISOString(),
        assigned_to: callerName,
        last_updated: nowStr
      })
      .eq('id', leadId);

    return { success: true };
  } catch (error: any) {
    console.error('[establishOwnershipLock]', error.message);
    return { success: false, error: error.message };
  }
}

export async function verifyOwnershipValidity(leadId: number) {
  try {
    const supabase = requireSupabase();
    const now = new Date();
    const nowStr = now.toISOString();

    // Check active ownership lock
    const { data: lock } = await supabase
      .from('lead_locks')
      .select('id, locked_by, lock_expiry')
      .eq('lead_id', leadId)
      .eq('lock_type', 'ownership')
      .eq('status', 'Active')
      .maybeSingle();

    if (!lock) return true;

    // Check if 60-day lease is expired
    if (new Date(lock.lock_expiry).getTime() < now.getTime()) {
      await expireOwnership(supabase, leadId, lock.id, '60_DAYS_LIMIT', lock.locked_by);
      return false;
    }

    // Check 14-day inactivity
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs, error: logErr } = await supabase
      .from('call_history')
      .select('id')
      .eq('lead_id', leadId)
      .gt('created_at', fourteenDaysAgo)
      .limit(1);

    if (logErr) throw new Error(logErr.message);

    if (!recentLogs || recentLogs.length === 0) {
      await expireOwnership(supabase, leadId, lock.id, '14_DAYS_INACTIVITY', lock.locked_by);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[verifyOwnershipValidity]', error.message);
    return false;
  }
}

async function expireOwnership(supabase: any, leadId: number, lockId: number, reason: string, ownerName: string) {
  await supabase.from('lead_locks').update({ status: 'Expired' }).eq('id', lockId);
  await supabase.from('leads').update({
    owner_caller_id: null,
    ownership_status: 'Expired',
    assigned_to: null,
    last_updated: new Date().toISOString()
  }).eq('id', leadId);

  await supabase.from('audit_logs').insert({
    caller_name: 'SYSTEM',
    action_type: `EXPIRE_OWNERSHIP_${reason}`,
    details: `Lead ownership held by ${ownerName} expired due to ${reason.toLowerCase().replace(/_/g, ' ')}.`,
    lead_id: leadId
  });

  broadcastSse('LOCK_RELEASED', { leadId, user: 'system' });
}

export async function runAutoExpirations() {
  try {
    const supabase = requireSupabase();
    const now = new Date();
    const nowStr = now.toISOString();

    // 1. Fetch active ownership locks
    const { data: activeLocks } = await supabase
      .from('lead_locks')
      .select('id, lead_id, locked_by, lock_expiry')
      .eq('lock_type', 'ownership')
      .eq('status', 'Active');

    if (!activeLocks || activeLocks.length === 0) return;

    for (const lock of activeLocks) {
      // Expiration check 1: 60 days duration
      if (new Date(lock.lock_expiry).getTime() < now.getTime()) {
        await expireOwnership(supabase, lock.lead_id, lock.id, '60_DAYS_LIMIT', lock.locked_by);
        continue;
      }

      // Expiration check 2: 14 days inactivity (no new entries in call_history)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await supabase
        .from('call_history')
        .select('id')
        .eq('lead_id', lock.lead_id)
        .gt('created_at', fourteenDaysAgo)
        .limit(1);

      if (!logs || logs.length === 0) {
        await expireOwnership(supabase, lock.lead_id, lock.id, '14_DAYS_INACTIVITY', lock.locked_by);
      }
    }
  } catch (err: any) {
    console.error('[runAutoExpirations] failed:', err.message);
  }
}

export async function getNextLeadAction(callerName: string) {
  try {
    const session = await requireCallerSession();
    // Validate request caller constraints
    const effectiveCallerName = session.role === 'Admin' || session.role === 'Supervisor' ? callerName : session.name;
    const supabase = requireSupabase();
    const now = new Date();
    const nowStr = now.toISOString();

    // Auto-expire old locks
    await runAutoExpirations();

    // 1. Check if caller already has an active lock on some lead
    const { data: activeLock } = await supabase
      .from('lead_locks')
      .select('lead_id, lock_expiry')
      .eq('locked_by', effectiveCallerName)
      .eq('lock_type', 'active_call')
      .eq('status', 'Active')
      .gt('lock_expiry', nowStr)
      .maybeSingle();

    if (activeLock) {
      // Fetch and return the currently locked lead details
      const { data: lead } = await supabase
        .from('leads')
        .select(LEAD_LIST_COLUMNS)
        .eq('id', activeLock.lead_id)
        .single();
      return { success: true, lead };
    }

    // 2. Fetch leads: assigned to caller or unassigned, filtering out locked/owned/converted ones
    const { data: candidates, error } = await supabase
      .from('leads')
      .select('id')
      .eq('do_not_contact', false)
      .not('call_status', 'in', '("Interested","Wrong Number","Not Interested","Accepted","Client Configured")')
      .or(`assigned_to.eq.${escapePostgrestFilterValue(effectiveCallerName)},assigned_to.is.null`)
      .order('priority', { ascending: true })
      .order('review_count', { ascending: false })
      .limit(10);

    if (error || !candidates || candidates.length === 0) {
      return { success: false, error: 'NO_AVAILABLE_LEADS' };
    }

    // Try to acquire an active lock on the first available candidate
    for (const candidate of candidates) {
      const lockRes = await acquireActiveLock(candidate.id, effectiveCallerName);
      if (lockRes.success) {
        const { data: lead } = await supabase
          .from('leads')
          .select(LEAD_LIST_COLUMNS)
          .eq('id', candidate.id)
          .single();
        
        // Log view lead event in audit logs
        await supabase.from('audit_logs').insert({
          caller_name: effectiveCallerName,
          action_type: 'VIEW_LEAD_DETAILS',
          details: `Lead details viewed inside dialer card cursor.`,
          lead_id: candidate.id
        });

        return { success: true, lead };
      }
    }

    return { success: false, error: 'ALL_CANDIDATES_LOCKED' };
  } catch (error: any) {
    console.error('[getNextLeadAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function skipLeadAction(leadId: number, callerName: string, callerRole: string, reason?: string) {
  try {
    if (callerName === 'Demo Caller') return { success: true };
    const supabase = requireSupabase();
    
    if (callerRole !== 'Admin') {
      if (!reason || reason.trim().length < 5) {
        return { success: false, error: 'A skip reason (minimum 5 characters) is required for non-admin accounts.' };
      }
    }
    
    const logDetails = reason ? `Reason: ${reason.trim()}` : `Skipped by Admin.`;
    await supabase.from('audit_logs').insert({
      caller_name: callerName,
      action_type: 'SKIP_LEAD',
      details: logDetails,
      lead_id: leadId
    });
    
    const res = await releaseActiveLock(leadId, callerName);
    return { success: res.success, error: res.error };
  } catch (error: any) {
    console.error('[skipLeadAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getCallActivityLogs() {
  try {
    await requireCallerSession();
    const supabase = requireSupabase();

    // Query call history logs
    const { data: callHistory, error: callErr } = await supabase
      .from('call_history')
      .select('id, created_at, caller_name, call_status, notes, lead_id')
      .order('created_at', { ascending: false })
      .limit(100);
    if (callErr) throw new Error(callErr.message);

    // Query skip logs
    const { data: skipLogs, error: skipErr } = await supabase
      .from('audit_logs')
      .select('id, created_at, caller_name, action_type, details, lead_id')
      .eq('action_type', 'SKIP_LEAD')
      .order('created_at', { ascending: false })
      .limit(100);
    if (skipErr) throw new Error(skipErr.message);

    // Collect all unique lead_ids
    const leadIds = Array.from(
      new Set(
        [
          ...(callHistory || []).map((c: any) => c.lead_id),
          ...(skipLogs || []).map((s: any) => s.lead_id)
        ].filter(Boolean)
      )
    );

    // Batch fetch lead details (agency_name, phone, email)
    const leadMap: Record<number, { agency_name: string; phone?: string; email?: string }> = {};
    if (leadIds.length > 0) {
      const { data: leadData, error: leadErr } = await supabase
        .from('leads')
        .select('id, agency_name, phone, email')
        .in('id', leadIds);

      if (!leadErr && leadData) {
        leadData.forEach((l: any) => {
          leadMap[l.id] = {
            agency_name: l.agency_name,
            phone: l.phone || undefined,
            email: l.email || undefined
          };
        });
      }
    }

    // Map to unified schema
    const formattedCalls = (callHistory || []).map((c: any) => ({
      id: `call_${c.id}`,
      created_at: c.created_at,
      caller_name: c.caller_name,
      action_type: `CALL: ${c.call_status}`,
      lead_id: c.lead_id,
      agency_name: leadMap[c.lead_id]?.agency_name || 'Unknown Lead',
      lead_phone: leadMap[c.lead_id]?.phone || '',
      lead_email: leadMap[c.lead_id]?.email || '',
      details: c.notes || 'No call notes recorded.'
    }));

    const formattedSkips = (skipLogs || []).map((s: any) => ({
      id: `skip_${s.id}`,
      created_at: s.created_at,
      caller_name: s.caller_name,
      action_type: s.action_type,
      lead_id: s.lead_id,
      agency_name: leadMap[s.lead_id]?.agency_name || 'Unknown Lead',
      lead_phone: leadMap[s.lead_id]?.phone || '',
      lead_email: leadMap[s.lead_id]?.email || '',
      details: s.details
    }));

    const combined = [...formattedCalls, ...formattedSkips]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 150);

    return { success: true, logs: combined };
  } catch (error: any) {
    console.error('[getCallActivityLogs Error]', error.message);
    return { success: false, error: error.message, logs: [] };
  }
}

