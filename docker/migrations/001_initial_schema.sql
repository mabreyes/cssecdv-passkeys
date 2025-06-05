-- Migration: 001_initial_schema.sql
-- Description: Create initial database schema for passkeys application
-- Date: 2024-01-01

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the passkey_credentials table
CREATE TABLE IF NOT EXISTS passkey_credentials (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_id BYTEA NOT NULL UNIQUE,
    public_key BYTEA NOT NULL,
    rp_id VARCHAR(255) NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_rp_id ON passkey_credentials(rp_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 