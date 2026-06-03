const { Client } = require('pg');

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
    console.log('Connected. Creating tables...');

    // 1. Create caller_profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS caller_profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        pin VARCHAR(20) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('caller_profiles table checked/created.');

    // 2. Create team_applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_applications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('team_applications table checked/created.');

    // 3. Seed default callers
    await client.query(`
      INSERT INTO caller_profiles (name, pin, gender) 
      VALUES 
        ('Hamid', '343536', 'Male'), 
        ('Oussama', '121314', 'Male'), 
        ('Kamel', '232425', 'Male')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('Default caller profiles seeded successfully.');

    await client.end();
    console.log('Database migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    try {
      await client.end();
    } catch (e) {}
    process.exit(1);
  }
}

run();
