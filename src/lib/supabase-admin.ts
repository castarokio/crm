import 'server-only';

import { createClient } from '@supabase/supabase-js';

function sanitizeEnvVar(value: string | undefined): string {
  if (!value) return '';
  let s = value.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1);
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1);
  }
  return s
    .replace(/\\r/g, '')
    .replace(/\\n/g, '')
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .trim();
}

const supabaseUrl = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = sanitizeEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabaseAdminClient: any = null;

export function getSupabaseAdmin(): any {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase Admin Client error: URL or service role key missing in environment.");
    return null;
  }
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseAdminClient;
}
