'use server';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  requireAdminSession,
  requireRole,
  requireWritableSession,
  setPortalSession,
} from '@/lib/auth-session';

const PIN_HASH_PREFIX = 'scrypt';
const PIN_HASH_BYTES = 32;

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

const ACTIVE_ASSIGNMENT_FILTER = 'call_status.is.null,call_status.eq.Not Called';
const IMPORTABLE_LEAD_FIELDS = [
  'agency_name', 'area', 'maps_link', 'address', 'phone', 'phone_2', 'email', 'email_2',
  'website', 'website_quality', 'facebook', 'instagram', 'tiktok', 'linkedin', 'social_link',
  'google_rating', 'review_count', 'followers_if_visible', 'facebook_followers',
  'instagram_followers', 'running_ads', 'services', 'notes', 'priority', 'contact_person'
];

function safeStringEqual(expected: string, supplied: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
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

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
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

function normalizeForDuplicate(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhoneForDuplicate(phone?: string | null) {
  if (!phone) return '';
  let clean = phone.trim().replace(/^00/, '+');
  const digits = clean.replace(/\D/g, '');
  if (!digits) return '';
  if (clean.startsWith('+')) return digits;
  if (digits.startsWith('0') && digits.length === 10) {
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

async function getActiveCallers(supabase: any): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('caller_profiles')
      .select('name')
      .neq('name', '__portal_settings__');
    if (error || !data || data.length === 0) {
      return ['Hamid', 'Oussama', 'Kamel'];
    }
    return data.map((p: any) => p.name);
  } catch {
    return ['Hamid', 'Oussama', 'Kamel'];
  }
}

async function findDuplicateLeadsInDb(supabase: any, importRows: any[]) {
  const phones = new Set<string>();
  const mapsLinks = new Set<string>();
  const names = new Set<string>();

  importRows.forEach(row => {
    if (row.phone) phones.add(normalizePhoneForDuplicate(row.phone));
    if (row.phone_2) phones.add(normalizePhoneForDuplicate(row.phone_2));
    if (row.maps_link) mapsLinks.add(normalizeForDuplicate(row.maps_link));
    if (row.agency_name) names.add(normalizeForDuplicate(row.agency_name));
  });

  const phoneList = Array.from(phones).filter(Boolean);
  const mapsList = Array.from(mapsLinks).filter(Boolean);
  const nameList = Array.from(names).filter(Boolean);

  if (phoneList.length === 0 && mapsList.length === 0 && nameList.length === 0) {
    return [];
  }

  const orConditions: string[] = [];
  if (phoneList.length > 0) {
    const escapedPhones = phoneList.map(p => `"${escapePostgrestFilterValue(p)}"`).join(',');
    orConditions.push(`phone.in.(${escapedPhones})`, `phone_2.in.(${escapedPhones})`);
  }
  if (mapsList.length > 0) {
    const escapedMaps = mapsList.map(m => `"${escapePostgrestFilterValue(m)}"`).join(',');
    orConditions.push(`maps_link.in.(${escapedMaps})`);
  }
  if (nameList.length > 0) {
    const escapedNames = nameList.map(n => `"${escapePostgrestFilterValue(n)}"`).join(',');
    orConditions.push(`agency_name.in.(${escapedNames})`);
  }

  const { data, error } = await supabase
    .from('leads')
    .select('id, agency_name, area, phone, phone_2, maps_link, website')
    .or(orConditions.join(','));

  if (error) throw new Error(error.message);
  return data || [];
}

export async function logAuditEvent(callerName: string, actionType: string, details: string, leadId?: number) {
  try {
    const supabase = requireSupabase();
    await supabase.from('audit_logs').insert({
      caller_name: callerName,
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
    q = q.not('call_status', 'in', '("Interested","Accepted","Client Configured")');

    const { error } = await q;
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'ALLOCATE_RANGE', `Assigned ID range #${startId} - #${endId} to ${caller} (Overwrite: ${forceReassign})`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
    
    const results = [];
    for (let idx = 0; idx < callers.length; idx++) {
      const caller = callers[idx];
      const ids = targetLeads
        .filter((_, i) => i % callers.length === idx)
        .map(x => x.id);

      if (ids.length === 0) continue;

      const res = await supabase
        .from('leads')
        .update({ assigned_to: caller })
        .in('id', ids);
      results.push(res);
    }

    const updateError = results.find(result => result?.error)?.error;
    if (updateError) throw new Error(updateError.message);
    await logAuditEvent(session.name, 'SPLIT_LEADS', `Divided ${totalLeads} unassigned uncalled leads equally among ${callers.length} callers`);
    return { success: true, totalAssigned: totalLeads };
  } catch (error: any) {
    console.error('[splitLeadsEqually]', error.message);
    return { success: false, error: error.message };
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
      },
    };
  } catch (error: any) {
    console.error('[downloadFullBackup]', error.message);
    return { success: false, error: error.message, backup: null };
  }
}

export async function resetCampaign(pin: string, adminCallerName: string = 'Hamid') {
  try {
    const session = await requireAdminSession();
    const adminPin = (process.env.ADMIN_RESET_PIN || '').replace(/[^0-9]/g, '');
    if (!adminPin || adminPin.length < 6) throw new Error('ADMIN_RESET_PIN_NOT_CONFIGURED');
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
        last_updated: new Date().toISOString()
      });

    if (resetErr) throw new Error(resetErr.message);

    // Delete all call history logs
    const { error: historyErr } = await supabase
      .from('call_history')
      .delete()
      .neq('id', -1); 

    if (historyErr) throw new Error(historyErr.message);

    await logAuditEvent(session.name, 'RESET_CAMPAIGN', `Reset entire campaign to zero`);
    return { success: true };
  } catch (error: any) {
    console.error('[resetCampaign]', error.message);
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
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    
    const { data: app, error: fetchErr } = await supabase
      .from('team_applications')
      .select('*')
      .eq('id', applicationId)
      .single();
      
    if (fetchErr || !app) throw new Error(fetchErr?.message || 'Application not found');
    
    if (status === 'Accepted') {
      if (!pin) throw new Error('PIN is required for caller creation.');
      const { error: profileErr } = await supabase
        .from('caller_profiles')
        .insert({
          name: app.name,
          pin: hashCallerPin(pin),
          gender: app.gender,
          role: 'Caller'
        });
      if (profileErr) throw new Error(profileErr.message);
    }

    if (status === 'Rejected') {
      const { error: deleteErr } = await supabase
        .from('team_applications')
        .delete()
        .eq('id', applicationId);
      if (deleteErr) throw new Error(deleteErr.message);
    } else {
      const { error: updateErr } = await supabase
        .from('team_applications')
        .update({ status })
        .eq('id', applicationId);
      if (updateErr) throw new Error(updateErr.message);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[handleApplicationDecision]', error.message);
    return { success: false, error: error.message };
  }
}


export async function updateCallerTargets(name: string, dailyTarget: number, weeklyTarget: number) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('caller_profiles')
      .update({
        daily_call_target: dailyTarget,
        weekly_appointment_target: weeklyTarget
      })
      .eq('name', name);
    if (error) throw new Error(error.message);
    await logAuditEvent(session.name, 'UPDATE_CALLER_TARGETS', `Updated targets for caller ${name}: Daily=${dailyTarget}, Weekly=${weeklyTarget}`);
    return { success: true };
  } catch (error: any) {
    console.error('[updateCallerTargets Error]', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCallerProfile(name: string) {
  try {
    const session = await requireAdminSession();
    if (name === 'Hamid') {
      throw new Error('ADMIN_CANNOT_BE_DELETED');
    }
    const supabase = requireSupabase();
    
    const { error } = await supabase
      .from('caller_profiles')
      .delete()
      .eq('name', name);
    if (error) throw new Error(error.message);
    
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

export async function extractCsvHeaders(csvText: string) {
  try {
    await requireAdminSession();
    const text = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const firstLine = text.split('\n')[0] || '';
    const headers = parseCsvLine(firstLine).map((h: string) => h.trim()).filter(Boolean);
    return { success: true, headers };
  } catch (error: any) {
    return { success: false, error: error.message, headers: [] };
  }
}

export async function previewLeadImportWithMapping(csvText: string, columnMapping: Record<string, string>) {
  try {
    await requireAdminSession();
    
    const mappedFields = Object.values(columnMapping).filter(field => field && field !== 'skip');
    const uniqueMappedFields = new Set(mappedFields);
    if (mappedFields.length !== uniqueMappedFields.size) {
      return { success: false, error: 'COLLIDING_COLUMN_MAPPING: Multiple CSV columns cannot be mapped to the same database field.', preview: null };
    }

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
      const normalized = normalizePhoneForDuplicate(raw);
      if (!normalized) return { normalized: '', display: raw, warning: 'Invalid phone format' };
      if (normalized.length < 8) return { normalized, display: raw, warning: 'Phone too short' };
      if (normalized.length > 15) return { normalized, display: raw, warning: 'Phone too long' };
      const display = raw.trim().startsWith('+') || raw.trim().startsWith('00') ? ('+' + normalized) : raw.trim();
      return { normalized, display, warning: null };
    };

    const existingRows = await findDuplicateLeadsInDb(supabase, parsedRows);
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
      return {
        ...row,
        phone_display: phoneResult.display || row.phone,
        phone_normalized: phoneResult.normalized,
        priority: row.priority || 3,
        call_status: 'Not Called',
        duplicate_reasons: reasons,
        warnings,
        importable: reasons.length === 0,
      };
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

export async function commitLeadImport(rows: any[], sourceFileName: string, adminCallerName: string, niche?: string | null) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();

    const importableRows = rows.filter((r: any) => r.importable !== false);
    if (importableRows.length === 0) {
      return { success: true, inserted: 0, skipped: rows.length };
    }

    const batchId = randomBytes(16).toString('hex');
    const { error: batchErr } = await supabase
      .from('import_batches')
      .insert({
        id: batchId,
        file_name: sourceFileName,
        total_rows: importableRows.length,
        created_by: session.name,
        created_at: new Date().toISOString(),
      });

    if (batchErr) throw new Error(batchErr.message);

    const toInsert = importableRows.map((row: any) => {
      const { row_number, duplicate_reasons, warnings, importable, phone_display, phone_normalized, ...clean } = row;
      return {
        ...clean,
        import_batch_id: batchId,
        source_file: sourceFileName,
        call_status: 'Not Called',
        priority: clean.priority ?? 3,
        niche: niche || null,
      };
    });

    const CHUNK_SIZE = 200;
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('leads').insert(chunk);
      if (error) throw new Error(error.message);
      inserted += chunk.length;
    }

    await logAuditEvent(session.name, 'IMPORT_LEADS', `Imported ${inserted} leads from "${sourceFileName}" (batch #${batchId})`);
    return { success: true, inserted, skipped: rows.length - inserted, batchId };
  } catch (error: any) {
    console.error('[commitLeadImport]', error.message);
    return { success: false, error: error.message, inserted: 0, skipped: 0 };
  }
}

export async function undoLastImport(adminCallerName: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();

    const { data: batches, error: batchErr } = await supabase
      .from('import_batches')
      .select('id, file_name, total_rows, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (batchErr) throw new Error(batchErr.message);
    if (!batches || batches.length === 0) {
      return { success: false, error: 'No import batches found to undo.' };
    }

    const batch = batches[0];

    const { count: calledCount, error: calledErr } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('import_batch_id', batch.id)
      .not('call_status', 'in', '("Not Called",null)');

    if (calledErr) throw new Error(calledErr.message);
    if (calledCount && calledCount > 0) {
      return {
        success: false,
        error: `Cannot undo: ${calledCount} leads from this batch have already been called or treated.`,
      };
    }

    const { error: deleteErr } = await supabase
      .from('leads')
      .delete()
      .eq('import_batch_id', batch.id);

    if (deleteErr) throw new Error(deleteErr.message);

    await logAuditEvent(session.name, 'UNDO_IMPORT', `Removed ${batch.total_rows} leads from batch #${batch.id} (${batch.file_name})`);
    return { success: true, removed: batch.total_rows, batchId: batch.id, sourceFile: batch.file_name };
  } catch (error: any) {
    console.error('[undoLastImport]', error.message);
    return { success: false, error: error.message, removed: 0 };
  }
}

export async function updateProfilePinAction(name: string, newPin: string) {
  try {
    const session = await requireAdminSession();
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      throw new Error('PIN must be exactly 6 numeric digits.');
    }

    const supabase = requireSupabase();
    const hashedPin = hashCallerPin(newPin);

    if (name === 'PORTAL') {
      const { data: existing } = await supabase
        .from('caller_profiles')
        .select('id')
        .eq('name', '__portal_settings__')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('caller_profiles')
          .update({ pin: hashedPin })
          .eq('name', '__portal_settings__');
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('caller_profiles')
          .insert({
            name: '__portal_settings__',
            pin: hashedPin,
            role: 'Viewer',
            gender: 'Male'
          });
        if (error) throw new Error(error.message);
      }
      await logAuditEvent(session.name, 'UPDATE_PORTAL_PIN', 'Updated Portal Gate access PIN securely');
    } else {
      const { error } = await supabase
        .from('caller_profiles')
        .update({ pin: hashedPin })
        .eq('name', name);
      if (error) throw new Error(error.message);
      await logAuditEvent(session.name, 'UPDATE_CALLER_PIN', `Updated secure access PIN for caller: ${name}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateProfilePinAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function submitInquiryAction(name: string, phone: string, destination: string, month: string) {
  try {
    const supabase = requireSupabase();
    const newLead = {
      agency_name: name.trim(),
      phone: phone.trim(),
      area: destination.trim(),
      notes: `Website Inquiry: Target Month is ${month.trim()}`,
      call_status: 'Not Called',
      priority: 1,
      source_file: 'Website Inquiry',
      last_updated: new Date().toISOString(),
    };

    const { error } = await supabase.from('leads').insert([newLead]);
    if (error) throw new Error(error.message);
    
    return { success: true };
  } catch (error: any) {
    console.error('[submitInquiryAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function createCallerDirectlyAction(params: {
  name: string;
  gender: string;
  pin: string;
  role: string;
  daily_call_target?: number;
  weekly_appointment_target?: number;
}) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();

    if (!params.name || !params.pin) {
      throw new Error('Name and PIN are required.');
    }

    const { error } = await supabase
      .from('caller_profiles')
      .insert({
        name: params.name,
        pin: hashCallerPin(params.pin),
        gender: params.gender,
        role: params.role || 'Caller',
        daily_call_target: params.daily_call_target ?? 80,
        weekly_appointment_target: params.weekly_appointment_target ?? 15
      });

    if (error) throw new Error(error.message);

    await logAuditEvent(session.name, 'CREATE_CALLER_DIRECT', `Created caller profile directly: ${params.name} (${params.role})`);

    return { success: true };
  } catch (error: any) {
    console.error('[createCallerDirectlyAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateCallerRoleAction(name: string, role: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();

    const { error } = await supabase
      .from('caller_profiles')
      .update({ role })
      .eq('name', name);

    if (error) throw new Error(error.message);

    await logAuditEvent(session.name, 'UPDATE_CALLER_ROLE', `Updated role of caller ${name} to ${role}`);

    return { success: true };
  } catch (error: any) {
    console.error('[updateCallerRoleAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function toggleCallerSuspensionAction(name: string, status: 'Active' | 'Disabled', reason?: string) {
  try {
    const session = await requireAdminSession();
    if (name === 'Hamid') {
      throw new Error('ADMIN_CANNOT_BE_SUSPENDED');
    }
    const supabase = requireSupabase();

    const { error } = await supabase
      .from('caller_profiles')
      .update({
        status,
        disabled_reason: status === 'Disabled' ? (reason || 'Suspended by admin compliance') : null
      })
      .eq('name', name);

    if (error) throw new Error(error.message);

    await logAuditEvent(session.name, status === 'Disabled' ? 'SUSPEND_CALLER' : 'ACTIVATE_CALLER', `${status} secure status of caller: ${name}`);

    return { success: true };
  } catch (error: any) {
    console.error('[toggleCallerSuspensionAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateGuidelinesAction(text: string, version: string) {
  try {
    const session = await requireAdminSession();
    const supabase = requireSupabase();

    // Check if __portal_settings__ exists
    const { data: existing } = await supabase
      .from('caller_profiles')
      .select('id')
      .eq('name', '__portal_settings__')
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('caller_profiles')
        .update({
          guidelines_text: text,
          guidelines_version: version
        })
        .eq('name', '__portal_settings__');
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('caller_profiles')
        .insert({
          name: '__portal_settings__',
          pin: '000000', // Dummy PIN
          role: 'Viewer',
          gender: 'Male',
          guidelines_text: text,
          guidelines_version: version
        });
      if (error) throw new Error(error.message);
    }

    await logAuditEvent(session.name, 'UPDATE_ONBOARDING_GUIDELINES', `Guidelines updated to version ${version}`);

    return { success: true };
  } catch (error: any) {
    console.error('[updateGuidelinesAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getGuidelinesAction() {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('caller_profiles')
      .select('guidelines_text, guidelines_version')
      .eq('name', '__portal_settings__')
      .maybeSingle();

    if (error) throw new Error(error.message);
    
    return {
      success: true,
      text: data?.guidelines_text || '',
      version: data?.guidelines_version || '1.0'
    };
  } catch (error: any) {
    console.error('[getGuidelinesAction]', error.message);
    return { success: false, error: error.message, text: '', version: '1.0' };
  }
}
