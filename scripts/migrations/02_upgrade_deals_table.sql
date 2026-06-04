-- Upgrading existing deals table to add tracking fields for payments, closers, and commissions
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_caller_id TEXT DEFAULT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS closer_id TEXT DEFAULT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS manager_id TEXT DEFAULT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) DEFAULT 'Starter';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS approved_value NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 20.00;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'No Payment';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_status VARCHAR(50) DEFAULT 'Waiting Deposit';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS scope_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS proposal_url TEXT DEFAULT NULL;

-- Backfill owner_caller_id from caller_name for existing deal records
UPDATE deals SET owner_caller_id = caller_name WHERE owner_caller_id IS NULL AND caller_name IS NOT NULL;
