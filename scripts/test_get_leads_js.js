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
  console.log('Querying lead counts grouped by area...');
  const { data, error } = await supabase.rpc('get_leads_by_area_summary'); // Let's check if there is an RPC or just query areas
  
  // If no RPC, let's query all areas and count them manually
  const { data: areasData, error: areasErr } = await supabase
    .from('leads')
    .select('area');
    
  if (areasErr) {
    console.error('Error:', areasErr);
    return;
  }
  
  const areaCounts = {};
  areasData.forEach(r => {
    const a = r.area || 'Unknown';
    areaCounts[a] = (areaCounts[a] || 0) + 1;
  });
  
  const sorted = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
  console.log('Leads count by area:');
  sorted.forEach(([area, count]) => {
    console.log(`- ${area}: ${count}`);
  });
}

test();
