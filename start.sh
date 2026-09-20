#!/bin/sh
# Railway start script — v3 with proper log forwarding
set -e

echo "=========================================="
echo "=== Railway Start Debug ==="
echo "NODE_ENV: ${NODE_ENV:-(empty)}"
echo "PORT: ${PORT:-(empty)}"
echo "DATABASE_URL (before fix): ${DATABASE_URL:-(empty)}"
echo "PWD: $(pwd)"
echo "=========================================="

# Ensure database directory exists (for SQLite)
mkdir -p /app/db

# Force an absolute path for DATABASE_URL — relative paths break in Next.js
export DATABASE_URL="file:/app/db/custom.db"
echo "DATABASE_URL (after fix): $DATABASE_URL"

# Set NODE_ENV to production (was empty in Railway!)
export NODE_ENV=production

# Run prisma db push to create the schema in the fresh database file
echo "=== Running prisma db push to initialize database ==="
cd /app
npx prisma db push --accept-data-loss 2>&1 | tail -10
echo "=========================================="

# If PORT is not set, default to 3000
if [ -z "$PORT" ]; then
  export PORT=3000
fi

# Next.js 16 uses HOSTNAME env var to bind to a specific interface
export HOSTNAME=0.0.0.0

echo "=== Files in /app/db ==="
ls -la /app/db 2>&1
echo "=========================================="
echo "=== Starting Next.js ==="
echo "PORT=$PORT HOSTNAME=$HOSTNAME NODE_ENV=$NODE_ENV"
echo "Using direct binary: ./node_modules/.bin/next"
echo "=========================================="

# Start Next.js in background with output redirected to a log file
# so we can read it later if the process dies
LOG_FILE=/tmp/nextjs.log
touch "$LOG_FILE"
tail -f "$LOG_FILE" &
TAIL_PID=$!

./node_modules/.bin/next start -p "$PORT" > "$LOG_FILE" 2>&1 &
NEXT_PID=$!
echo "Next.js started with PID: $NEXT_PID, logs at $LOG_FILE"

# Wait for Next.js to be ready (up to 30 seconds)
echo "=== Waiting for Next.js to be ready ==="
READY=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  sleep 2
  if curl -sf "http://127.0.0.1:$PORT/api/health" > /tmp/health.txt 2>&1; then
    echo "✓ Next.js is responding on port $PORT (after ${i}x2s)"
    echo "  Health response: $(cat /tmp/health.txt | head -c 500)"
    READY=1
    break
  fi
  echo "  Attempt $i: not ready yet..."
  
  # Check if process is still alive
  if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "✗ Next.js process died!"
    echo "=== Last 50 lines of Next.js log ==="
    tail -50 "$LOG_FILE"
    kill $TAIL_PID 2>/dev/null
    exit 1
  fi
done

if [ "$READY" -ne 1 ]; then
  echo "⚠ Next.js did not respond within 30s. Showing log:"
  echo "=== Next.js log ==="
  tail -50 "$LOG_FILE"
fi

echo "=========================================="
echo "=== Next.js is running. Following logs (forwarding to stdout)... ==="
echo "=========================================="

# Wait for Next.js — this keeps the container alive
# tail -f already forwards logs to stdout, but we also wait for the process
wait $NEXT_PID
EXIT_CODE=$?
kill $TAIL_PID 2>/dev/null
echo "Next.js exited with code: $EXIT_CODE"
exit $EXIT_CODE
