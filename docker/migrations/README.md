# Database Migrations

This directory contains all database migrations for the passkeys application. Migrations are run automatically when the PostgreSQL container starts up.

## Migration System

- **Migration Tracking**: The `schema_migrations` table tracks which migrations have been executed
- **Automatic Execution**: Migrations run automatically during database startup via `run_migrations.sql`
- **Idempotent**: Migrations can be run multiple times safely - already executed migrations are skipped

## Migration Files

| File                                 | Description                                                                    | Date       |
| ------------------------------------ | ------------------------------------------------------------------------------ | ---------- |
| `001_initial_schema.sql`             | Create initial database schema (users, passkey_credentials, indexes, triggers) | 2024-01-01 |
| `002_add_constraints.sql`            | Add unique constraints to prevent duplicate passkeys                           | 2024-01-02 |
| `003_case_insensitive_usernames.sql` | Implement case-insensitive username handling                                   | 2024-01-03 |

## Adding New Migrations

1. Create a new file with the next sequential number: `004_your_migration_name.sql`
2. Add a header comment with migration info:
   ```sql
   -- Migration: 004_your_migration_name.sql
   -- Description: What this migration does
   -- Date: YYYY-MM-DD
   ```
3. Add the migration to `run_migrations.sql`:
   ```sql
   -- Migration 004: Your Migration
   \i /docker-entrypoint-initdb.d/migrations/004_your_migration_name.sql
   INSERT INTO schema_migrations (version, description)
   VALUES ('004', 'What this migration does')
   ON CONFLICT (version) DO NOTHING;
   ```

## Migration Guidelines

- **Always use `IF NOT EXISTS`** for CREATE statements
- **Use DO blocks** for conditional ALTER statements
- **Include error handling** for constraint additions
- **Make migrations idempotent** - they should be safe to run multiple times
- **Test migrations** on a copy of production data before deployment

## Checking Migration Status

Connect to the database and run:

```sql
SELECT version, description, executed_at
FROM schema_migrations
ORDER BY version;
```

## Rollback Strategy

Currently, rollbacks are manual. For each migration, consider:

1. Can this be safely rolled back?
2. What data might be lost?
3. Document the rollback steps in the migration file

## Development Workflow

1. Start fresh: `docker-compose down -v && docker-compose up --build`
2. This will run all migrations from scratch
3. Check logs to ensure migrations completed successfully
4. Verify with `docker-compose exec postgres psql -U passkeys_user -d passkeys_db -c "SELECT * FROM schema_migrations;"`
