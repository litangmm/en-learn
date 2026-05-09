#!/bin/bash
# Start Evolution Dashboard for en-learn
PORT=3456
PID_FILE=".claude/evolution/dashboard.pid"

cd "$(dirname "$0")/../.."

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Dashboard already running at http://localhost:$PORT"
    exit 0
  fi
fi

node scripts/evolution/dashboard/server.cjs &
echo $! > "$PID_FILE"
echo "🚀 en-learn Dashboard started at http://localhost:$PORT"
