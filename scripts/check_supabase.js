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


if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error fetching leads:', error);
      return;
    }
    console.log('Total leads count:', count);
    
    // Fetch a single row to inspect columns
    const { data: rows, error: rowError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    if (rowError) {
      console.error('Error fetching single lead:', rowError);
      return;
    }
    console.log('Columns in leads table:', Object.keys(rows[0] || {}));
    console.log('Sample row:', rows[0]);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

check();
