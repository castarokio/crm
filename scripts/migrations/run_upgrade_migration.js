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
    console.log('Connected to Postgres database.');

    const sqlPath = path.join(__dirname, '02_upgrade_deals_table.sql');
    console.log(`Reading SQL file from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration script...');
    const res = await client.query(sql);
    console.log('SQL Migration executed successfully. Result:', res);

    await client.end();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Postgres migration failed:', err.stack || err.message || err);
    process.exit(1);
  }
}

run();
