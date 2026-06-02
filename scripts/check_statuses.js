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

async function check() {
  const { data, error } = await supabase
    .from('leads')
    .select('call_status');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const counts = {};
  data.forEach(row => {
    const status = row.call_status || 'null';
    counts[status] = (counts[status] || 0) + 1;
  });
  
  console.log('Status counts in database:', counts);
}

check();
