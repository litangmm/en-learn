#!/bin/bash
set -euo pipefail

# Evolution Engine Deployment Script for en-learn
# Deploys to Vercel static hosting
# Usage: ./scripts/evolution/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVOLUTION_DIR="$PROJECT_DIR/.claude/evolution"
LOG_FILE="$EVOLUTION_DIR/deploy.log"

log() {
  local level="$1"
  local message="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Main
log "INFO" "=== Evolution Engine Deployment ==="
log "INFO" "Environment: VERCEL"
log "INFO" "Project: $PROJECT_DIR"

# Build
log "INFO" "Building frontend..."
cd "$PROJECT_DIR"
npm run build 2>&1 | tail -20

if [ ! -d "dist" ]; then
  log "ERROR" "Build failed - dist directory not found"
  exit 1
fi
log "INFO" "Build complete"

# Deploy to Vercel
log "INFO" "Deploying to Vercel..."
if command -v vercel >/dev/null 2>&1; then
  DEPLOY_OUTPUT=$(cd "$PROJECT_DIR" && vercel --prod --yes 2>&1)
else
  DEPLOY_OUTPUT=$(cd "$PROJECT_DIR" && npx vercel --prod --yes 2>&1)
fi

VERCEL_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9-]+\.vercel\.app' | tail -1)

if [ -n "$VERCEL_URL" ]; then
  log "INFO" "✅ Deployment successful"
  log "INFO" "  URL: $VERCEL_URL"
else
  log "WARN" "Could not extract Vercel URL from output"
  log "INFO" "Deploy output: $DEPLOY_OUTPUT"
fi

log "INFO" "=== Deployment Complete ==="
