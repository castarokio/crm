-- Run after rotating all exposed Supabase credentials.
-- The application accesses these tables through authenticated server actions.

ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS caller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS caller_profiles ALTER COLUMN pin TYPE TEXT;

DROP POLICY IF EXISTS "Public deals access" ON deals;

REVOKE ALL ON TABLE leads FROM anon, authenticated;
REVOKE ALL ON TABLE call_history FROM anon, authenticated;
REVOKE ALL ON TABLE caller_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE team_applications FROM anon, authenticated;
REVOKE ALL ON TABLE audit_logs FROM anon, authenticated;
REVOKE ALL ON TABLE import_batches FROM anon, authenticated;
REVOKE ALL ON TABLE deals FROM anon, authenticated;

-- Realtime subscriptions using the anon key will stop after this migration.
-- Do not restore public table policies; add a server-mediated realtime channel instead.
