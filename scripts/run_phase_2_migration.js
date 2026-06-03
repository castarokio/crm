const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const host = 'aws-1-eu-central-1.pooler.supabase.com';
  console.log(`Connecting to Supabase PG pooler at: ${host}...`);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    host,
    port: 6543,
    user: 'postgres.bpenacfdynhgcvdznygb',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PG. Reading phase_2_pipeline.sql...');

    const sqlPath = path.join(__dirname, 'phase_2_pipeline.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration...');
    const res = await client.query(sql);
    console.log('SQL Migration complete:', res);

    await client.end();
  } catch (err) {
    console.error('Postgres migration failed:', err.message);
  }
}

run();
