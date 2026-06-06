const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env variables from .env
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at', envPath);
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars in .env:', { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listDeals() {
  try {
    const { data: deals, error } = await supabase
      .from('deals')
      .select('id, deal_name, company_name, caller_name, stage, setup_value, recurring_value');

    if (error) {
      console.error('Error fetching deals:', error);
      return;
    }

    console.log('--- ACTIVE DEALS ---');
    console.log(JSON.stringify(deals, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

listDeals();
