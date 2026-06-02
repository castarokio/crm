const { Client } = require('pg');
const sqlite3 = require('sqlite3');

async function migratePostgres() {
  const host = 'aws-1-eu-central-1.pooler.supabase.com';
  console.log(`Connecting to Postgres pooler at: ${host}...`);
  
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
    console.log('Connected to Postgres. Running alter table queries to add locking columns...');
    
    await client.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS locked_by TEXT DEFAULT NULL;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    `);
    console.log('Postgres alter table completed successfully.');
    
    await client.end();
  } catch (err) {
    console.error('Postgres migration failed:', err.message);
    try {
      await client.end();
    } catch (e) {}
  }
}

function migrateSQLite() {
  const localDbPath = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
  console.log(`Connecting to SQLite database: ${localDbPath}...`);
  
  const fs = require('fs');
  if (!fs.existsSync(localDbPath)) {
    console.log('SQLite database not found. Skipping.');
    return;
  }

  const db = new sqlite3.Database(localDbPath);
  db.serialize(() => {
    db.run("ALTER TABLE leads ADD COLUMN locked_by TEXT", () => {});
    db.run("ALTER TABLE leads ADD COLUMN locked_at TEXT", () => {});
    console.log('SQLite columns checked / altered.');
    db.close();
  });
}

async function run() {
  await migratePostgres();
  migrateSQLite();
}

run();
