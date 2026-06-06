/**
 * run_sql_indexes.js
 * Applies performance-improving SQL indexes via Supabase RPC (raw SQL).
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx < 0) return;
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const SQL_STATEMENTS = [
  // Index for all .eq('name', ...) queries (caller login, portal settings)
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_caller_profiles_name
   ON caller_profiles (name);`,

  // Index for audit log queries filtered by caller_name
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_caller_name
   ON audit_logs (caller_name);`,

  // Index for status filtering (Pending/Active/Disabled)
  `CREATE INDEX IF NOT EXISTS idx_caller_profiles_status
   ON caller_profiles (status);`,

  // Index for team_applications dedup check
  `CREATE INDEX IF NOT EXISTS idx_team_applications_email_status
   ON team_applications (email, status);`,
];

async function run() {
  let errors = 0;
  for (const sql of SQL_STATEMENTS) {
    const label = sql.match(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
    const { error } = await supabase.rpc('exec_sql', { query: sql }).maybeSingle().catch(() => ({ error: { message: 'RPC not available' } }));
    
    if (error) {
      // Try direct query approach
      const res = await supabase.from('_sql').select('*').limit(0).then(() => null).catch(e => e);
      console.warn(`ℹ️   ${label}: ${error.message} — run manually in Supabase SQL editor`);
    } else {
      console.log(`✅  ${label}: index applied`);
    }
  }

  console.log('\n── SQL to run manually in Supabase SQL Editor if needed ──────────────');
  for (const sql of SQL_STATEMENTS) {
    console.log(sql.trim());
    console.log();
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
