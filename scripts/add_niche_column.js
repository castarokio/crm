const { Client } = require('pg');
const sqlite3 = require('sqlite3');
const fs = require('fs');

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
    console.log('Connected to Postgres. Adding niche column...');
    
    await client.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS niche VARCHAR(255) DEFAULT NULL;
    `);
    console.log('Column niche added/checked.');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads (niche);
    `);
    console.log('Index idx_leads_niche created/checked.');
    
    await client.end();
  } catch (err) {
    console.error('Postgres migration failed:', err.message);
    try {
      await client.end();
    } catch (e) {}
    throw err;
  }
}

function migrateSQLite() {
  const localDbPath = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
  if (!fs.existsSync(localDbPath)) {
    console.log('SQLite database not found. Skipping SQLite migration.');
    return;
  }

  console.log(`Connecting to SQLite database: ${localDbPath}...`);
  const db = new sqlite3.Database(localDbPath);
  db.serialize(() => {
    db.run("ALTER TABLE leads ADD COLUMN niche TEXT DEFAULT NULL", (err) => {
      if (err) {
        console.log('SQLite column alter info (might already exist):', err.message);
      } else {
        console.log('SQLite column niche added.');
      }
    });
    db.run("CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads (niche)", (err) => {
      if (err) {
        console.log('SQLite index creation failed:', err.message);
      } else {
        console.log('SQLite index idx_leads_niche checked.');
      }
    });
    db.close();
  });
}

async function run() {
  try {
    await migratePostgres();
    migrateSQLite();
    console.log('Migration finished successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
