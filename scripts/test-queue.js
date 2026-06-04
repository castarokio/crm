const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const callerName = 'Oussama';
  let q = supabase
    .from('leads')
    .select('id, agency_name, call_status, assigned_to, last_updated')
    .or('call_status.eq.Not Called,call_status.is.null,call_status.eq.Recalled');

  const safeCaller = 'Oussama';
  q = q.or(`assigned_to.eq.${safeCaller},assigned_to.is.null`);
  
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  q = q.or(`assigned_to.eq.${safeCaller},assigned_to.is.null,last_updated.lt.${tenMinutesAgo}`);

  const { data, error } = await q.limit(5);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Results:', data);
  }
}
run();
