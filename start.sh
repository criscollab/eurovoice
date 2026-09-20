#!/bin/sh
# Railway start script — robust version with port verification
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
echo "PORT=$PORT HOSTNAME=$HOSTNAME"
echo "Using direct binary: ./node_modules/.bin/next"
echo "=========================================="

# Start Next.js in background so we can verify it's listening
./node_modules/.bin/next start -p "$PORT" &
NEXT_PID=$!
echo "Next.js started with PID: $NEXT_PID"

# Wait for Next.js to be ready (up to 30 seconds)
echo "=== Waiting for Next.js to be ready ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  sleep 2
  if curl -s "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; then
    echo "✓ Next.js is responding on port $PORT (after ${i}x2s)"
    break
  fi
  echo "  Attempt $i: not ready yet..."
  
  # Check if process is still alive
  if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "✗ Next.js process died! Exit code: $?"
    echo "=== Last 50 lines of Next.js output ==="
    wait $NEXT_PID 2>/dev/null
    exit 1
  fi
done

# Final verification
echo "=== Final port check ==="
echo "Listening sockets:"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | grep -E ":$PORT|:8080|:3000" || echo "(could not list sockets)"
echo "=========================================="

# Health check response
echo "=== Testing /api/health locally ==="
curl -sS "http://127.0.0.1:$PORT/api/health" || echo "(curl failed)"
echo ""
echo "=========================================="

# Now wait for the Next.js process forever (this keeps the container alive)
echo "=== Next.js is running. Following logs... ==="
wait $NEXT_PID
