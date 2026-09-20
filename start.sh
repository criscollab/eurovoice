#!/bin/sh
# Railway start script — v6 with explicit -H flag
echo "=========================================="
echo "=== Railway Start Debug ==="
echo "NODE_ENV: ${NODE_ENV:-(empty)}"
echo "PORT: ${PORT:-(empty)}"
echo "DATABASE_URL (before fix): ${DATABASE_URL:-(empty)}"
echo "PWD: $(pwd)"
echo "=========================================="

# Set NODE_ENV to production
export NODE_ENV=production

# Ensure database directory exists (for SQLite)
mkdir -p /app/db

# Force an absolute path for DATABASE_URL
export DATABASE_URL="file:/app/db/custom.db"
echo "DATABASE_URL (after fix): $DATABASE_URL"

# Run prisma db push to create the schema
echo "=== Running prisma db push to initialize database ==="
cd /app
npx prisma db push --accept-data-loss 2>&1 | tail -10
echo "=========================================="

# If PORT is not set, default to 3000
if [ -z "$PORT" ]; then
  export PORT=3000
fi

# Next.js 16: -H is supported (confirmed via --help)
# Default is 0.0.0.0 but we pass it explicitly to be safe
echo "=== Files in /app/db ==="
ls -la /app/db 2>&1
echo "=========================================="
echo "=== Starting Next.js ==="
echo "PORT=$PORT NODE_ENV=$NODE_ENV"
echo "Using: exec ./node_modules/.bin/next start -H 0.0.0.0 -p $PORT"
echo "=========================================="

# Use exec to make Next.js PID 1
# Use -H 0.0.0.0 explicitly (verified working in Next.js 16.3.5)
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "$PORT"
