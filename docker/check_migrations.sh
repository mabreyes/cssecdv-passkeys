#!/bin/bash

# Script to check migration status
# Usage: ./docker/check_migrations.sh

echo "🔍 Checking database migration status..."
echo "========================================="

# Check if containers are running
if ! docker-compose ps | grep -q "passkeys-postgres.*Up"; then
    echo "❌ PostgreSQL container is not running"
    echo "💡 Start with: docker-compose up -d"
    exit 1
fi

# Connect to database and show migration status
docker-compose exec postgres psql -U passkeys_user -d passkeys_db -c "
    SELECT 
        version,
        description,
        executed_at
    FROM schema_migrations 
    ORDER BY version;
"

echo ""
echo "✅ Migration status check completed"
echo "💡 To add a new migration, see docker/migrations/README.md"