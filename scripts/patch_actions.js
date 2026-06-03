const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, '../src/app/actions.ts');
let content = fs.readFileSync(actionsPath, 'utf8');

// Target the corrupted function previewLeadImportWithMapping
const startMarker = 'export async function previewLeadImportWithMapping';
const endMarker = '// ── Phase 2: Deal Pipeline Actions';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers in actions.ts');
  process.exit(1);
}

const replacement = `export async function previewLeadImportWithMapping(csvText: string, columnMapping: Record<string, string>) {
  try {
    await requireAdminSession();
    
    // Check for column mapping collisions
    const mappedFields = Object.values(columnMapping).filter(field => field && field !== 'skip');
    const uniqueMappedFields = new Set(mappedFields);
    if (mappedFields.length !== uniqueMappedFields.size) {
      return { success: false, error: 'COLLIDING_COLUMN_MAPPING: Multiple CSV columns cannot be mapped to the same database field.', preview: null };
    }

    const supabase = requireSupabase();
    const lines = csvText.replace(/^\\uFEFF/, '').split(/\\r?\\n/).filter((l: string) => l.trim());
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
      const agencyArea = \`\${normalizeForDuplicate(row.agency_name)}|\${normalizeForDuplicate(row.area)}\`;
      if (pn && existingRows.some((l: any) => normalizePhoneValues(l.phone).includes(pn) || normalizePhoneValues(l.phone_2).includes(pn))) reasons.push('Duplicate phone in DB');
      if (mapN && existingRows.some((l: any) => normalizeForDuplicate(l.maps_link) === mapN)) reasons.push('Duplicate maps_link');
      if (row.agency_name && row.area && existingRows.some((l: any) => \`\${normalizeForDuplicate(l.agency_name)}|\${normalizeForDuplicate(l.area)}\` === agencyArea)) reasons.push('Duplicate name+area');
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

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(actionsPath, newContent, 'utf8');
console.log('Successfully patched previewLeadImportWithMapping in actions.ts!');
