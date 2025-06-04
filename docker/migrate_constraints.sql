-- Migration script to add unique constraints to existing passkey_credentials table
-- This prevents duplicate passkeys and race conditions

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

-- Add unique constraint on raw_id if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE passkey_credentials ADD CONSTRAINT unique_raw_id UNIQUE (raw_id);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, skip
            NULL;
    END;
END $$;

-- Add unique constraint on (user_id, rp_id) if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE passkey_credentials ADD CONSTRAINT unique_user_rp UNIQUE (user_id, rp_id);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, skip
            NULL;
    END;
END $$;