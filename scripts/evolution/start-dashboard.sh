#!/bin/bash
# Unified Evolution Dashboard (LAN accessible)
PORT=3456
PID_FILE=".claude/evolution/dashboard.pid"

cd "$(dirname "$0")/../.."

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
    echo "🚀 Dashboard already running"
    echo "   Local:  http://localhost:$PORT"
    echo "   LAN:    http://$LAN_IP:$PORT"
    exit 0
  fi
fi

node scripts/evolution/dashboard/server.cjs > .claude/evolution/dashboard.log 2>&1 &
echo $! > "$PID_FILE"

LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo "🚀 Unified Dashboard started"
echo "   Local:  http://localhost:$PORT"
echo "   LAN:    http://$LAN_IP:$PORT"
echo "   Projects: en-learn + clouth-ai-web"
