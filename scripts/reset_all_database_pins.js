const { createClient } = require('@supabase/supabase-js');
const { randomBytes, scryptSync } = require('crypto');
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

function hashPin(pin) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function run() {
  console.log('Fetching all caller profiles from database...');
  const { data: profiles, error: fetchError } = await supabase
    .from('caller_profiles')
    .select('id, name');

  if (fetchError) {
    console.error('❌ Failed to fetch profiles:', fetchError.message);
    return;
  }

  console.log(`Found ${profiles.length} profiles. Setting all PINs to "000000"...`);

  for (const profile of profiles) {
    const hashed = hashPin('000000');
    const { error: updateError } = await supabase
      .from('caller_profiles')
      .update({ pin: hashed })
      .eq('id', profile.id);

    if (updateError) {
      console.error(`❌ Failed to update ${profile.name}:`, updateError.message);
    } else {
      console.log(`✅ Set PIN for ${profile.name} (ID: ${profile.id}) to "000000"`);
    }
  }

  console.log('\nAll PINs updated successfully!');
}

run().catch(console.error);
