import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import fs from 'fs';

// ── Supabase client (production) ──────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

let supabase: ReturnType<typeof createClient> | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  console.log('[DB Config] Using Supabase cloud database.');
} else {
  // ── SQLite fallback for local development ─────────────────────────────────
  const localDbPath = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
  console.log(`[DB Config] No Supabase URL. Connecting to local SQLite: ${localDbPath}`);

  if (fs.existsSync(localDbPath)) {
    sqliteDb = new sqlite3.Database(localDbPath, (err) => {
      if (err) {
        console.error('[DB Error] Failed to open local SQLite db:', err);
      } else {
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

// ── Unified query interface ───────────────────────────────────────────────────
export async function query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  // 1. Supabase via REST
  if (supabase) {
    // Parse the SQL into Supabase query builder calls
    const trimmed = text.trim().toLowerCase();

    if (trimmed.startsWith('select count(*)')) {
      // Build a count query by forwarding raw SQL via rpc if needed
      // We'll use a simple approach: execute via postgres function
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    // For all other queries, use raw SQL via rpc (exec_sql) - with fallback to direct table ops
    // Since exec_sql may not exist, we delegate to the table-based helpers below
    // The actions.ts will call specific helpers instead of raw query() for complex ops
    throw new Error('Use supabase client directly in actions.ts for this query');
  }

  // 2. SQLite fallback
  if (sqliteDb) {
    let sqliteQuery = text
      .replace(/\$\d+/g, '?')
      .replace(/ILIKE/g, 'LIKE')
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now', 'localtime')")
      .replace(/CURRENT_DATE/g, "date('now', 'localtime')");

    return new Promise((resolve, reject) => {
      const isSelect = sqliteQuery.trim().toLowerCase().startsWith('select');
      if (isSelect) {
        sqliteDb!.all(sqliteQuery, params, (err, rows) => {
          if (err) { reject(err); } else { resolve({ rows: rows || [], rowCount: rows?.length || 0 }); }
        });
      } else {
        sqliteDb!.run(sqliteQuery, params, function (err) {
          if (err) { reject(err); } else { resolve({ rows: [], rowCount: this.changes || 0 }); }
        });
      }
    });
  }

  console.warn('[DB Warn] No database configured.');
  return { rows: [], rowCount: 0 };
}

export { supabase, sqliteDb };
export default supabase;
