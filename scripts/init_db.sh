#!/bin/bash

# Database initialization script
# This script creates the first migration if it doesn't exist and applies it

set -e

echo "🗄️  Initializing database..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if migrations directory is empty
if [ -z "$(ls -A alembic/versions)" ]; then
    echo "📝 Creating initial migration..."
    alembic revision --autogenerate -m "Initial migration"
    echo "✅ Initial migration created!"
fi

# Apply migrations
echo "🔄 Applying migrations..."
alembic upgrade head
echo "✅ Migrations applied!"

echo "✅ Database initialization complete!"

