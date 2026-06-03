-- Phase 2: Deal Pipeline Migration
-- Run this in the Supabase SQL Editor

-- 1. Create the deals table
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  deal_name TEXT NOT NULL,
  company_name TEXT,
  caller_name TEXT,
  stage TEXT DEFAULT 'New' CHECK (stage IN (
    'New',
    'Contacted',
    'Interested',
    'Appointment Booked',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost'
  )),
  setup_value NUMERIC(10,2) DEFAULT 0,
  recurring_value NUMERIC(10,2) DEFAULT 0,
  expected_close_date DATE,
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS. Deals are accessed only by server actions using the service role.
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public deals access" ON deals;
REVOKE ALL ON TABLE deals FROM anon, authenticated;

-- 3. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_caller ON deals(caller_name);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);

-- 4. Add daily_call_target column to caller_profiles if not already added in Phase 1
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS daily_call_target INTEGER DEFAULT 80;
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS weekly_appointment_target INTEGER DEFAULT 15;

SELECT 'Phase 2 migration complete' as status;
