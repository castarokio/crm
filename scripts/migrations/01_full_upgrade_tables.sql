-- Upgrading existing caller_profiles table with role, trust level, status and agreement properties
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Caller';
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS trust_level VARCHAR(50) DEFAULT 'New';
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS agreement_accepted_version VARCHAR(50) DEFAULT NULL;
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS disabled_reason TEXT DEFAULT NULL;

-- Upgrading existing leads table with ownership lock variables and do not contact flag
ALTER TABLE leads ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_caller_id TEXT DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ownership_status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ownership_start_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ownership_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Ensure indexes are created for performance search
CREATE INDEX IF NOT EXISTS idx_leads_owner_caller ON leads(owner_caller_id) WHERE owner_caller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_do_not_contact ON leads(do_not_contact);

-- Creating Lead Locks Table (handles active session locks & caller claims)
CREATE TABLE IF NOT EXISTS lead_locks (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    lock_type VARCHAR(50) NOT NULL, -- 'active_call', 'ownership'
    locked_by VARCHAR(100) NOT NULL, -- caller name
    lock_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lock_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Released', 'Expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lead_locks_lookup ON lead_locks(lead_id, status);

-- Creating Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    amount_expected NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_received NUMERIC(12, 2) DEFAULT 0.00,
    payment_type VARCHAR(50) NOT NULL, -- 'deposit', 'milestone', 'final', 'extra'
    payment_method VARCHAR(50) NOT NULL, -- 'BaridiMob', 'CCP', 'Cash', 'Bank Transfer', 'Other'
    confirmed_by VARCHAR(100) DEFAULT NULL, -- manager/admin profile name
    proof_url TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Refunded', 'Disputed'
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creating Commissions Table
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    caller_id VARCHAR(100) NOT NULL,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
    commission_rate NUMERIC(5, 2) NOT NULL,
    payment_amount NUMERIC(12, 2) NOT NULL,
    commission_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending Payment', -- 'Pending Payment', 'Pending Approval', 'Approved', 'Paid', 'Delayed', 'Cancelled', 'Disputed'
    approved_by VARCHAR(100) DEFAULT NULL,
    paid_by VARCHAR(100) DEFAULT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    proof_url TEXT DEFAULT NULL,
    dispute_id INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creating Projects Table (Project delivery & checklist tracker)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    assigned_developer_id VARCHAR(100) DEFAULT NULL,
    package_type VARCHAR(50) NOT NULL, -- 'Starter', 'Professional', 'Premium', 'Custom'
    approved_scope TEXT DEFAULT NULL,
    client_content_status JSONB DEFAULT '{}'::jsonb,
    current_stage VARCHAR(50) DEFAULT 'Waiting Deposit', -- 'Waiting Deposit', 'Deposit Paid', 'Waiting Content', 'Content Received', 'Design Started', 'Development Started', 'First Preview Ready', 'Revision Round 1', 'Revision Round 2', 'Final Approval', 'Waiting Final Payment', 'Delivered', 'Archived'
    preview_url TEXT DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    final_payment_status VARCHAR(50) DEFAULT 'Unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creating Disputes Table (Caller protection & commissions disputes)
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    opened_by VARCHAR(100) NOT NULL,
    dispute_type VARCHAR(50) NOT NULL, -- 'ownership', 'commission', 'payment_status', 'duplicate_lead'
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
    commission_id INTEGER REFERENCES commissions(id) ON DELETE SET NULL,
    explanation TEXT NOT NULL,
    proof_url TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Under Review', 'Waiting for Proof', 'Accepted', 'Rejected', 'Split Decision', 'Resolved', 'Closed'
    decision TEXT DEFAULT NULL,
    decided_by VARCHAR(100) DEFAULT NULL,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creating Audit Logs Table (Strict operations tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) DEFAULT NULL,
    old_value TEXT DEFAULT NULL,
    new_value TEXT DEFAULT NULL,
    severity VARCHAR(50) DEFAULT 'Info', -- 'Info', 'Warning', 'Suspicious', 'Critical'
    ip_address VARCHAR(50) DEFAULT NULL,
    device_info TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creating Trap Leads Table (Canary detectors)
CREATE TABLE IF NOT EXISTS trap_leads (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to VARCHAR(100) DEFAULT NULL,
    trap_type VARCHAR(50) DEFAULT 'phone',
    expected_behavior TEXT DEFAULT NULL,
    triggered BOOLEAN DEFAULT FALSE,
    triggered_by VARCHAR(100) DEFAULT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
