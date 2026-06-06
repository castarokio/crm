const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i < 0) return;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function run() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, try querying pg_catalog
    console.log('RPC get_tables failed, querying schema info via sql execution if possible...');
    const { data: tables, error: sqlError } = await supabase.from('caller_profiles').select('*').limit(1);
    if (sqlError) console.error('Supabase query error:', sqlError);
    else console.log('Successfully connected to caller_profiles, but unable to list all tables natively.');
  } else {
    console.log('Tables:', data);
  }
}

run().catch(console.error);
