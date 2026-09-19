#!/bin/sh
# Railway start script with debug info
echo "=========================================="
echo "=== Railway Start Debug ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: $DATABASE_URL"
echo "PWD: $(pwd)"
echo "Files in /app:"
ls -la /app 2>&1 | head -20
echo "=========================================="

# Ensure database directory exists (for SQLite)
mkdir -p /app/db

# If DATABASE_URL is not set, default to a Railway-friendly path
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/db/custom.db"
  echo "Set DATABASE_URL to: $DATABASE_URL"
fi

# If PORT is not set, default to 3000
if [ -z "$PORT" ]; then
  export PORT=3000
  echo "Set PORT to: $PORT"
fi

echo "=== Starting Next.js ==="
echo "Command: npx next start -H 0.0.0.0 -p $PORT"
echo "=========================================="

# Start Next.js — use exec so signals propagate correctly
exec npx next start -H 0.0.0.0 -p "$PORT"
