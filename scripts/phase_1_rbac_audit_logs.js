const { Client } = require('pg');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const { randomBytes, scryptSync } = require('crypto');

function hashPin(pin) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function run() {
  // ─── POSTGRES (SUPABASE) MIGRATION ───
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
    console.log('Connected to PG. Running alterations...');

    // Add role and target columns to caller_profiles
    await client.query(`
      ALTER TABLE caller_profiles ALTER COLUMN pin TYPE TEXT;
      ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Caller';
      ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS daily_call_target INTEGER DEFAULT 80;
      ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS weekly_appointment_target INTEGER DEFAULT 15;
    `);
    console.log('caller_profiles altered in Postgres.');

    // Seed/update roles and default users
    const defaultPins = [
      process.env.HAMID_PIN,
      process.env.OUSSAMA_PIN,
      process.env.KAMEL_PIN,
      process.env.YACINE_PIN,
      process.env.SOFIANE_PIN
    ];
    if (defaultPins.some(pin => !pin)) {
      throw new Error('HAMID_PIN, OUSSAMA_PIN, KAMEL_PIN, YACINE_PIN, and SOFIANE_PIN are required');
    }
    await client.query(`
      INSERT INTO caller_profiles (name, pin, gender, role, daily_call_target, weekly_appointment_target) 
      VALUES 
        ('Hamid', $1, 'Male', 'Admin', 80, 15), 
        ('Oussama', $2, 'Male', 'Caller', 80, 15), 
        ('Kamel', $3, 'Male', 'Caller', 80, 15),
        ('Yacine', $4, 'Male', 'Supervisor', 80, 15),
        ('Sofiane', $5, 'Male', 'Viewer', 80, 15)
      ON CONFLICT (name) DO UPDATE 
      SET 
        role = EXCLUDED.role,
        daily_call_target = EXCLUDED.daily_call_target,
        weekly_appointment_target = EXCLUDED.weekly_appointment_target;
    `, defaultPins.map(hashPin));
    console.log('Postgres profiles updated with roles/targets.');

    // Create audit_logs table in Postgres
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        caller_name VARCHAR(100) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        details TEXT DEFAULT NULL,
        lead_id INTEGER DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Postgres audit_logs table verified/created.');

    await client.end();
  } catch (err) {
    console.error('Postgres migration failed:', err.message);
  }

  // ─── SQLITE MIGRATION ───
  const localDbPath = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
  if (fs.existsSync(localDbPath)) {
    console.log(`Connecting to local SQLite: ${localDbPath}...`);
    const sqliteDb = new sqlite3.Database(localDbPath);
    
    sqliteDb.serialize(() => {
      // Alter table
      sqliteDb.run("ALTER TABLE caller_profiles ADD COLUMN role TEXT DEFAULT 'Caller'", () => {});
      sqliteDb.run("ALTER TABLE caller_profiles ADD COLUMN daily_call_target INTEGER DEFAULT 80", () => {});
      sqliteDb.run("ALTER TABLE caller_profiles ADD COLUMN weekly_appointment_target INTEGER DEFAULT 15", () => {});
      
      // Update/insert default profiles in SQLite using individual try-catch blocks
      sqliteDb.run(`
        INSERT INTO caller_profiles (name, pin, gender, role, daily_call_target, weekly_appointment_target)
        VALUES ('Hamid', ?, 'Male', 'Admin', 80, 15)
        ON CONFLICT(name) DO UPDATE SET
          role='Admin', daily_call_target=80, weekly_appointment_target=15
      `, [defaultPins[0]], (err) => { if (err) console.log('SQLite Seed Hamid Warning:', err.message); });

      sqliteDb.run(`
        INSERT INTO caller_profiles (name, pin, gender, role, daily_call_target, weekly_appointment_target)
        VALUES ('Oussama', ?, 'Male', 'Caller', 80, 15)
        ON CONFLICT(name) DO UPDATE SET
          role='Caller', daily_call_target=80, weekly_appointment_target=15
      `, [defaultPins[1]], (err) => { if (err) console.log('SQLite Seed Oussama Warning:', err.message); });

      sqliteDb.run(`
        INSERT INTO caller_profiles (name, pin, gender, role, daily_call_target, weekly_appointment_target)
        VALUES ('Kamel', ?, 'Male', 'Caller', 80, 15)
        ON CONFLICT(name) DO UPDATE SET
          role='Caller', daily_call_target=80, weekly_appointment_target=15
      `, [defaultPins[2]], (err) => { if (err) console.log('SQLite Seed Kamel Warning:', err.message); });

      sqliteDb.run(`
        INSERT INTO caller_profiles (name, pin, gender, role, daily_call_target, weekly_appointment_target)
        VALUES ('Yacine', ?, 'Male', 'Supervisor', 80, 15)
        ON CONFLICT(name) DO UPDATE SET
          role='Supervisor', daily_call_target=80, weekly_appointment_target=15
      `, [defaultPins[3]], (err) => { if (err) console.log('SQLite Seed Yacine Warning:', err.message); });

      sqliteDb.run(`
        INSERT INTO caller_profiles (name, pin, gender, role, daily_call_target, weekly_appointment_target)
        VALUES ('Sofiane', ?, 'Male', 'Viewer', 80, 15)
        ON CONFLICT(name) DO UPDATE SET
          role='Viewer', daily_call_target=80, weekly_appointment_target=15
      `, [defaultPins[4]], (err) => { if (err) console.log('SQLite Seed Sofiane Warning:', err.message); });

      // Create audit_logs table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          caller_name TEXT NOT NULL,
          action_type TEXT NOT NULL,
          details TEXT DEFAULT NULL,
          lead_id INTEGER DEFAULT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create SQLite audit_logs table:', err.message);
        } else {
          console.log('SQLite alterations and audit_logs table verified/created.');
        }
      });
      
      sqliteDb.close();
    });
  } else {
    console.log('Local SQLite DB not found; skipped SQLite migration.');
  }
}

run();
