#!/bin/sh
# Railway start script — v8 using standalone server
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

# Use the PORT that Railway provides, default to 3000 if not set
if [ -z "$PORT" ]; then
  export PORT=3000
  echo "PORT was not set, using default: $PORT"
fi

echo "=== Files in /app ==="
ls -la /app 2>&1 | head -30
echo "=========================================="
echo "=== Files in /app/.next/standalone ==="
ls -la /app/.next/standalone 2>&1 | head -30
echo "=========================================="
echo "=== Starting Next.js (standalone) ==="
echo "PORT=$PORT NODE_ENV=$NODE_ENV HOSTNAME=0.0.0.0"
echo "Using: exec node .next/standalone/server.js"
echo "=========================================="

# Copy static assets to standalone dir (Next.js standalone doesn't include them by default)
if [ -d /app/public ]; then
  cp -r /app/public /app/.next/standalone/public 2>/dev/null || true
fi
if [ -d /app/.next/static ]; then
  mkdir -p /app/.next/standalone/.next
  cp -r /app/.next/static /app/.next/standalone/.next/static 2>/dev/null || true
fi

# Use exec with the standalone server
# Set HOSTNAME=0.0.0.0 (this DOES work for standalone server.js)
export HOSTNAME=0.0.0.0
exec node /app/.next/standalone/server.js
