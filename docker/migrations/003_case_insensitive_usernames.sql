-- Migration: 003_case_insensitive_usernames.sql
-- Description: Implement case-insensitive username handling
-- Date: 2024-01-03

-- Create a unique index on lowercase username to enforce case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower 
ON users (LOWER(username));

-- Update existing usernames to lowercase to normalize the data
-- This ensures consistency with the case-insensitive validation we implemented
UPDATE users SET username = LOWER(username) WHERE username != LOWER(username);

-- Add a check constraint to ensure all new usernames are stored in lowercase
DO $$
BEGIN
    BEGIN
        ALTER TABLE users ADD CONSTRAINT chk_username_lowercase 
        CHECK (username = LOWER(username));
    EXCEPTION
        WHEN duplicate_object THEN
            -- Constraint already exists, skip
            NULL;
    END;
END $$; 