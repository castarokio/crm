const { Client } = require('pg');

const connectionString = 'postgresql://postgres.bpenacfdynhgcvdznygb:tA4J%25nHKFLPdz.D@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    // 1. Add assigned_to and manual_priority columns to leads table
    console.log('Adding assignments and priority columns to leads...');
    await client.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT NULL;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS manual_priority INTEGER DEFAULT NULL;
    `);

    // 2. Create call_history table
    console.log('Creating call_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS call_history (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL,
        caller_name VARCHAR(100) NOT NULL,
        call_status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
