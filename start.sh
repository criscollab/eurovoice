#!/bin/sh
# Railway start script with debug info
echo "=== Railway Start Debug ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: $DATABASE_URL"
echo "PWD: $(pwd)"
echo "==========================="

# Ensure database directory exists (for SQLite)
mkdir -p /app/db

# If DATABASE_URL is not set, default to a Railway-friendly path
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/db/custom.db"
  echo "Set DATABASE_URL to: $DATABASE_URL"
fi

# Start Next.js
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}
