const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const host = 'aws-1-eu-central-1.pooler.supabase.com';
  console.log(`Connecting to Supabase PG pooler at: ${host}...`);


  const client = new Client({
    host,
    port: 6543,
    user: 'postgres.bpenacfdynhgcvdznygb',
    password: 'tA4J%nHKFLPdz.D',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PG. Reading security_hardening_migration.sql...');

    const sqlPath = path.join(__dirname, 'security_hardening_migration.sql');
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
