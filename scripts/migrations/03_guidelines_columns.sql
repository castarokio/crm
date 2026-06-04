-- Add guidelines text and version config columns to caller_profiles table
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS guidelines_text TEXT DEFAULT NULL;
ALTER TABLE caller_profiles ADD COLUMN IF NOT EXISTS guidelines_version VARCHAR(50) DEFAULT '1.0';
