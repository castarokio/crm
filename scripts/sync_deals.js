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

async function run() {
  console.log('Fetching leads with pipeline-relevant statuses...');
  const { data: leads, error: fetchErr } = await supabase
    .from('leads')
    .select('id, agency_name, call_status, caller_name')
    .in('call_status', ['Interested', 'Callback', 'Accepted', 'Client Configured', 'Not Interested', 'Wrong Number']);

  if (fetchErr) {
    console.error('Error fetching leads:', fetchErr);
    return;
  }

  console.log(`Found ${leads.length} leads. Synchronizing to deals...`);

  for (const lead of leads) {
    let stage = null;
    if (lead.call_status === 'Interested') stage = 'Interested';
    else if (lead.call_status === 'Callback') stage = 'Appointment Booked';
    else if (['Accepted', 'Client Configured'].includes(lead.call_status)) stage = 'Won';
    else if (['Not Interested', 'Wrong Number'].includes(lead.call_status)) stage = 'Lost';

    if (!stage) continue;

    // Check if deal already exists
    const { data: existingDeal } = await supabase
      .from('deals')
      .select('id')
      .eq('lead_id', lead.id)
      .maybeSingle();

    if (existingDeal) {
      console.log(`Deal already exists for lead ID ${lead.id}. Updating stage to ${stage}...`);
      await supabase
        .from('deals')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', existingDeal.id);
    } else {
      console.log(`Creating deal for lead ID ${lead.id} ("${lead.agency_name}") with stage ${stage}...`);
      await supabase
        .from('deals')
        .insert({
          deal_name: `${lead.agency_name || 'Leads'} Deal`,
          company_name: lead.agency_name || '',
          caller_name: lead.caller_name || 'System',
          lead_id: lead.id,
          stage,
          setup_value: 0.00,
          recurring_value: 0.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
  }

  console.log('Synchronization complete!');
}

run();
