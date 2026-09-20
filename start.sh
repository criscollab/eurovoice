#!/bin/sh
# Railway start script — v5 final
echo "=========================================="
echo "=== Railway Start Debug ==="
echo "NODE_ENV: ${NODE_ENV:-(empty)}"
echo "PORT: ${PORT:-(empty)}"
echo "DATABASE_URL (before fix): ${DATABASE_URL:-(empty)}"
echo "PWD: $(pwd)"
echo "=========================================="

# Set NODE_ENV to production (was empty in Railway!)
export NODE_ENV=production

# Ensure database directory exists (for SQLite)
mkdir -p /app/db

# Force an absolute path for DATABASE_URL — relative paths break in Next.js
export DATABASE_URL="file:/app/db/custom.db"
echo "DATABASE_URL (after fix): $DATABASE_URL"

# Run prisma db push to create the schema in the fresh database file
echo "=== Running prisma db push to initialize database ==="
cd /app
npx prisma db push --accept-data-loss 2>&1 | tail -10
echo "=========================================="

# If PORT is not set, default to 3000
if [ -z "$PORT" ]; then
  export PORT=3000
fi

# Next.js 16 uses HOSTNAME env var (not -H flag) to bind to a specific interface
export HOSTNAME=0.0.0.0

echo "=== Files in /app/db ==="
ls -la /app/db 2>&1
echo "=========================================="
echo "=== Starting Next.js ==="
echo "PORT=$PORT NODE_ENV=$NODE_ENV HOSTNAME=$HOSTNAME"
echo "Using: exec ./node_modules/.bin/next start -p $PORT"
echo "=========================================="

# CRITICAL: Use exec to replace this shell with Next.js.
# This makes Next.js PID 1 in the container, which is what Railway expects.
# Railway sends SIGTERM to PID 1 for graceful shutdown.
# Next.js 16 reads HOSTNAME env var to bind to 0.0.0.0
exec ./node_modules/.bin/next start -p "$PORT"
