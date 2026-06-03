import 'server-only';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
let supabaseAdminClient: any = null;

export function getSupabaseAdmin(): any {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseAdminClient;
}
