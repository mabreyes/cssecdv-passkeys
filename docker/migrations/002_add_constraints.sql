-- Migration: 002_add_constraints.sql
-- Description: Add unique constraints to prevent duplicate passkeys and race conditions
-- Date: 2024-01-02

-- First, remove any existing duplicate credentials (keep the earliest one)
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, rp_id ORDER BY created_at ASC) as rn
    FROM passkey_credentials
)
DELETE FROM passkey_credentials 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint on (user_id, rp_id) if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE passkey_credentials ADD CONSTRAINT unique_user_rp UNIQUE (user_id, rp_id);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, skip
            NULL;
        WHEN duplicate_object THEN
            -- Constraint already exists, skip
            NULL;
    END;
END $$;

-- Ensure raw_id unique constraint exists (it's already in the table definition but let's be explicit)
DO $$
BEGIN
    BEGIN
        -- Check if constraint exists first
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'passkey_credentials_raw_id_key'
        ) THEN
            ALTER TABLE passkey_credentials ADD CONSTRAINT passkey_credentials_raw_id_key UNIQUE (raw_id);
        END IF;
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, skip
            NULL;
        WHEN duplicate_object THEN
            -- Constraint already exists, skip
            NULL;
    END;
END $$; 