#!/bin/bash
# Railway start script — v10 using bash (sh doesn't support ${VAR:-default})

echo "=========================================="
echo "=== Railway Start Debug ==="
echo "NODE_ENV: ${NODE_ENV:-(empty)}"
echo "PORT: ${PORT:-(empty)}"
echo "DATABASE_URL preview: ${DATABASE_URL:0:30}..."
echo "PWD: $(pwd)"
echo "=========================================="

# Set NODE_ENV to production
export NODE_ENV=production

# Verify DATABASE_URL is set (required for PostgreSQL)
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set!"
  echo "Please add DATABASE_URL in Railway Variables (from your PostgreSQL service)"
  exit 1
fi

# If DATABASE_URL doesn't start with postgresql://, convert it
case "$DATABASE_URL" in
  postgresql://*)
    echo "DATABASE_URL is a valid PostgreSQL URL"
    ;;
  postgres://*)
    export DATABASE_URL="postgresql://${DATABASE_URL#postgres://}"
    echo "Converted postgres:// to postgresql://"
    ;;
  *)
    echo "ERROR: DATABASE_URL must be a PostgreSQL URL (starting with 'postgresql://')"
    echo "Current value: ${DATABASE_URL:0:30}..."
    exit 1
    ;;
esac

echo "=== Running prisma db push to initialize database ==="
cd /app
npx prisma db push --accept-data-loss 2>&1 | tail -15
echo "=========================================="

# If PORT is not set, default to 3000
if [ -z "$PORT" ]; then
  export PORT=3000
fi

echo "=== Files in /app ==="
ls -la /app 2>&1 | head -10
echo "=========================================="
echo "=== Starting Next.js (standalone) ==="
echo "PORT=$PORT NODE_ENV=$NODE_ENV HOSTNAME=0.0.0.0"
echo "Using: exec node .next/standalone/server.js"
echo "=========================================="

# Copy static assets to standalone dir
if [ -d /app/public ]; then
  cp -r /app/public /app/.next/standalone/public 2>/dev/null || true
fi
if [ -d /app/.next/static ]; then
  mkdir -p /app/.next/standalone/.next
  cp -r /app/.next/static /app/.next/standalone/.next/static 2>/dev/null || true
fi

# Use exec with the standalone server
export HOSTNAME=0.0.0.0
exec node /app/.next/standalone/server.js
