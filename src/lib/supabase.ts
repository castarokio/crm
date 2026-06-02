import { createClient } from '@supabase/supabase-js';

// Singleton Supabase client: created only when env vars exist.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
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
