import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';

let pool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

// Read DATABASE_URL for Postgres
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  } else {
    const globalWithPg = global as typeof globalThis & {
      pgPool?: Pool;
    };

    if (!globalWithPg.pgPool) {
      globalWithPg.pgPool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
    pool = globalWithPg.pgPool;
  }
  console.log('[DB Config] Using cloud PostgreSQL Database.');
} else {
  // Fallback to local SQLite database in development
  const localDbPath = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
  console.log(`[DB Config] No DATABASE_URL. Connecting to local SQLite: ${localDbPath}`);
  
  if (fs.existsSync(localDbPath)) {
    sqliteDb = new sqlite3.Database(localDbPath, (err) => {
      if (err) {
        console.error('[DB Error] Failed to open local SQLite db:', err);
      } else {
        // Safely expand database schema if caller tracking columns are missing
        sqliteDb?.serialize(() => {
          sqliteDb?.run("ALTER TABLE leads ADD COLUMN caller_name TEXT", () => {});
          sqliteDb?.run("ALTER TABLE leads ADD COLUMN meeting_date TEXT", () => {});
          sqliteDb?.run("ALTER TABLE leads ADD COLUMN contact_person TEXT", () => {});
          sqliteDb?.run("ALTER TABLE leads ADD COLUMN call_status TEXT DEFAULT 'Not Called'", () => {});
          sqliteDb?.run("ALTER TABLE leads ADD COLUMN call_notes TEXT DEFAULT ''", () => {});
          sqliteDb?.run("ALTER TABLE leads ADD COLUMN last_called_at TEXT", () => {});
        });
        console.log('[DB Config] Local SQLite connected & schema checked.');
      }
    });
  } else {
    console.error(`[DB Error] SQLite file not found at: ${localDbPath}`);
  }
}

export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  // 1. PostgreSQL Driver Execution
  if (pool) {
    const res = await pool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0,
    };
  }
  
  // 2. SQLite Driver Execution with SQL Parameter & Syntax Translation
  if (sqliteDb) {
    let sqliteQuery = text
      .replace(/\$\d+/g, '?') // Convert PG $1, $2 parameters to SQLite ? parameters
      .replace(/ILIKE/g, 'LIKE') // Convert case-insensitive ILIKE to SQLite case-insensitive LIKE
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now', 'localtime')")
      .replace(/CURRENT_DATE/g, "date('now', 'localtime')");

    return new Promise((resolve, reject) => {
      const isSelect = sqliteQuery.trim().toLowerCase().startsWith('select');
      
      if (isSelect) {
        sqliteDb!.all(sqliteQuery, params, (err, rows) => {
          if (err) {
            console.error('[SQLite Query Error]', err, sqliteQuery);
            reject(err);
          } else {
            resolve({
              rows: rows || [],
              rowCount: rows?.length || 0,
            });
          }
        });
      } else {
        sqliteDb!.run(sqliteQuery, params, function (err) {
          if (err) {
            console.error('[SQLite Execute Error]', err, sqliteQuery);
            reject(err);
          } else {
            resolve({
              rows: [],
              rowCount: this.changes || 0,
            });
          }
        });
      }
    });
  }

  // 3. Fallback when neither is configured
  console.warn('[DB Warn] Executing query on unconfigured database connection.');
  return { rows: [], rowCount: 0 };
}
export default pool;
