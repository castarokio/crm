const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Querying leads...');
  let q = supabase.from('leads').select('*', { count: 'exact' });
  q = q.eq('call_status', 'Not Interested');
  
  const { data, count, error } = await q.range(0, 11);
  if (error) {
    console.error('Query failed:', error.message);
  } else {
    console.log('Success! Leads found:', data.length, 'Total count:', count);
  }
}

test();
