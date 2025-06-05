-- Migration Runner Script
-- This script sets up the migration tracking system and runs all migrations

-- Create schema_migrations table to track which migrations have been run
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    description TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to run a migration if it hasn't been run yet
CREATE OR REPLACE FUNCTION run_migration(migration_version VARCHAR(255), migration_description TEXT, migration_sql TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if migration has already been run
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = migration_version) THEN
        -- Execute the migration SQL
        EXECUTE migration_sql;
        
        -- Record that this migration has been run
        INSERT INTO schema_migrations (version, description) 
        VALUES (migration_version, migration_description);
        
        RAISE NOTICE 'Migration % completed: %', migration_version, migration_description;
    ELSE
        RAISE NOTICE 'Migration % already executed, skipping', migration_version;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Run migrations in order
\echo 'Starting database migrations...'

-- Migration 001: Initial Schema
\i /docker-entrypoint-initdb.d/migrations/001_initial_schema.sql
INSERT INTO schema_migrations (version, description) 
VALUES ('001', 'Create initial database schema for passkeys application')
ON CONFLICT (version) DO NOTHING;

-- Migration 002: Add Constraints  
\i /docker-entrypoint-initdb.d/migrations/002_add_constraints.sql
INSERT INTO schema_migrations (version, description) 
VALUES ('002', 'Add unique constraints to prevent duplicate passkeys and race conditions')
ON CONFLICT (version) DO NOTHING;

-- Migration 003: Case-insensitive Usernames
\i /docker-entrypoint-initdb.d/migrations/003_case_insensitive_usernames.sql
INSERT INTO schema_migrations (version, description) 
VALUES ('003', 'Implement case-insensitive username handling')
ON CONFLICT (version) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO passkeys_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO passkeys_user;

-- Insert test data only if it doesn't exist
INSERT INTO users (username) VALUES ('testuser') ON CONFLICT (username) DO NOTHING;

\echo 'Database migrations completed successfully!'

-- Show migration status
SELECT version, description, executed_at 
FROM schema_migrations 
ORDER BY version; 