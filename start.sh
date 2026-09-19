#!/bin/sh
# Railway start script with debug info
echo "=========================================="
echo "=== Railway Start Debug ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL (before fix): $DATABASE_URL"
echo "PWD: $(pwd)"
echo "=========================================="

# Ensure database directory exists (for SQLite)
mkdir -p /app/db

# Force an absolute path for DATABASE_URL — relative paths break in Next.js
# because it can resolve them from different working directories.
export DATABASE_URL="file:/app/db/custom.db"
echo "DATABASE_URL (after fix): $DATABASE_URL"

# Run prisma db push to create the schema in the fresh database file
# (Railway containers are ephemeral — the DB file doesn't persist between deploys)
echo "=== Running prisma db push to initialize database ==="
cd /app
npx prisma db push --accept-data-loss 2>&1 | tail -20
echo "=========================================="

# If PORT is not set, default to 3000
if [ -z "$PORT" ]; then
  export PORT=3000
  echo "Set PORT to: $PORT"
fi

echo "=== Files in /app/db ==="
ls -la /app/db 2>&1
echo "=========================================="

echo "=== Starting Next.js ==="
echo "Command: npx next start -H 0.0.0.0 -p $PORT"
echo "=========================================="

# Start Next.js — use exec so signals propagate correctly
exec npx next start -H 0.0.0.0 -p "$PORT"
