import psycopg2
import os

url = "postgresql://postgres.bpenacfdynhgcvdznygb:tA4J%25nHKFLPdz.D@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

try:
    print("Connecting to Supabase...")
    conn = psycopg2.connect(url)
    cursor = conn.cursor()
    print("Connected successfully! Running schema updates...")
    
    cursor.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT NULL;")
    cursor.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS manual_priority INTEGER DEFAULT NULL;")
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS call_history (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL,
        caller_name VARCHAR(100) NOT NULL,
        call_status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    """)
    conn.commit()
    print("Migration completed successfully!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error during migration: {e}")
