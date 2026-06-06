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
const supabaseKey = sanitizeEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY) || sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
let supabaseClient: any = null;

export function getSupabase(): any {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}
