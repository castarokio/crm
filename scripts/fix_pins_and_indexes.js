/**
 * fix_pins_and_indexes.js
 * 
 * 1. Hashes each caller's correct PIN from .env and updates it in Supabase
 * 2. Also fixes the portal settings PIN
 * 3. Reports which rows were updated
 */

const { createClient } = require('@supabase/supabase-js');
const { randomBytes, scryptSync } = require('crypto');
const fs = require('fs');

// ── Parse .env ────────────────────────────────────────────────────────────────
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx < 0) return;
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
});

function getCleanPin(varName) {
  const v = env[varName] || '';
  return v.replace(/[^0-9]/g, '');
}

function hashPin(pin) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

// ── Supabase client ───────────────────────────────────────────────────────────
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing SUPABASE URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Callers to fix ────────────────────────────────────────────────────────────
const callers = [
  { name: 'Hamid',   pinEnv: 'HAMID_PIN',   role: 'Admin'      },
  { name: 'Oussama', pinEnv: 'OUSSAMA_PIN',  role: 'Caller'     },
  { name: 'Kamel',   pinEnv: 'KAMEL_PIN',    role: 'Caller'     },
];

// Portal settings
const PORTAL_PIN = getCleanPin('PORTAL_PIN');

async function run() {
  let errors = 0;

  // ── Update caller PINs ─────────────────────────────────────────────────────
  for (const caller of callers) {
    const pin = getCleanPin(caller.pinEnv);
    if (!pin) {
      console.warn(`⚠️  ${caller.name}: No PIN found in env (${caller.pinEnv}) — skipping`);
      continue;
    }

    const hashed = hashPin(pin);
    const { error } = await supabase
      .from('caller_profiles')
      .update({ pin: hashed })
      .eq('name', caller.name);

    if (error) {
      console.error(`❌  ${caller.name}: ${error.message}`);
      errors++;
    } else {
      console.log(`✅  ${caller.name}: PIN updated  (raw PIN = ${pin})`);
    }
  }

  // ── Update portal settings PIN ─────────────────────────────────────────────
  if (PORTAL_PIN) {
    const portalHashed = hashPin(PORTAL_PIN);
    const { error } = await supabase
      .from('caller_profiles')
      .update({ pin: portalHashed })
      .eq('name', '__portal_settings__');

    if (error) {
      console.error(`❌  __portal_settings__: ${error.message}`);
      errors++;
    } else {
      console.log(`✅  __portal_settings__: Portal PIN updated  (raw PIN = ${PORTAL_PIN})`);
    }
  } else {
    console.warn('⚠️  PORTAL_PIN not set in .env — skipping portal settings update');
  }

  console.log('\n────────────────────────────────────────');
  if (errors === 0) {
    console.log('🎉  All PINs updated successfully!');
  } else {
    console.log(`⚠️  Done with ${errors} error(s). Check output above.`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
