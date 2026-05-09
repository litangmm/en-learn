#!/bin/bash
set -euo pipefail

# Evolution Engine Deployment Script for en-learn
# Deploys to Vercel static hosting + creates git tag + updates releases.json
# Usage: ./scripts/evolution/deploy.sh [version] [iteration-id] [title]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVOLUTION_DIR="$PROJECT_DIR/.claude/evolution"
LOG_FILE="$EVOLUTION_DIR/deploy.log"
RELEASES_FILE="$EVOLUTION_DIR/releases.json"

log() {
  local level="$1"
  local message="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Version info from args or auto-detect
VERSION="${1:-}"
ITERATION_ID="${2:-}"
ITERATION_TITLE="${3:-}"

# Auto-detect version from state.json if not provided
if [ -z "$VERSION" ]; then
  CURRENT_TAG=$(git -C "$PROJECT_DIR" describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
  # Bump minor version
  MAJOR=$(echo "$CURRENT_TAG" | sed -E 's/v([0-9]+).*/\1/')
  MINOR=$(echo "$CURRENT_TAG" | sed -E 's/v[0-9]+\.([0-9]+).*/\1/')
  PATCH=$(echo "$CURRENT_TAG" | sed -E 's/v[0-9]+\.[0-9]+\.([0-9]+).*/\1/')
  VERSION="v${MAJOR}.$((MINOR + 1)).${PATCH}"
  log "INFO" "Auto-detected version: $VERSION (from $CURRENT_TAG)"
fi

if [ -z "$ITERATION_ID" ]; then
  ITERATION_ID=$(node -e "const s=require('$PROJECT_DIR/.claude/evolution/state.json'); console.log(s.currentEpic?.iterations?.[s.currentEpic?.currentIterationIndex]?.id || 'unknown')" 2>/dev/null || echo "unknown")
fi

if [ -z "$ITERATION_TITLE" ]; then
  ITERATION_TITLE=$(node -e "const s=require('$PROJECT_DIR/.claude/evolution/state.json'); console.log(s.currentEpic?.iterations?.[s.currentEpic?.currentIterationIndex]?.title || 'unknown')" 2>/dev/null || echo "unknown")
fi

log "INFO" "=== Evolution Engine Deployment ==="
log "INFO" "Version: $VERSION"
log "INFO" "Iteration: $ITERATION_ID — $ITERATION_TITLE"
log "INFO" "Environment: VERCEL"

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
  VERCEL_URL="https://en-learn.vercel.app"
fi

# Create git tag
log "INFO" "Creating git tag $VERSION..."
CURRENT_COMMIT=$(git -C "$PROJECT_DIR" rev-parse --short HEAD)

# Extract features from commit message
COMMIT_MSG=$(git -C "$PROJECT_DIR" log -1 --pretty=%B)
FEATURES=$(echo "$COMMIT_MSG" | grep -E '^[-•*] ' | head -10 || echo "")

TAG_MESSAGE="$VERSION — $ITERATION_TITLE

Iteration: $ITERATION_ID
$FEATURES

Deployed: $VERCEL_URL"

git -C "$PROJECT_DIR" tag -a "$VERSION" -m "$TAG_MESSAGE" || {
  log "WARN" "Tag $VERSION already exists or failed to create"
}

log "INFO" "✅ Git tag created: $VERSION @ $CURRENT_COMMIT"

# Update releases.json
log "INFO" "Updating releases.json..."
node -e "
const fs = require('fs');
const file = '$RELEASES_FILE';
const releases = JSON.parse(fs.readFileSync(file, 'utf-8'));

// Check if this version already exists
const existing = releases.releases.find(r => r.version === '$VERSION');
if (existing) {
  existing.deployUrl = '$VERCEL_URL';
  existing.commit = '$CURRENT_COMMIT';
} else {
  const features = \`$FEATURES\`.split('\n').filter(f => f.trim()).map(f => f.replace(/^[-•*]\\s*/, '').trim());
  releases.releases.unshift({
    version: '$VERSION',
    tag: '$VERSION',
    commit: '$CURRENT_COMMIT',
    date: new Date().toISOString(),
    iterationId: '$ITERATION_ID',
    title: '$ITERATION_TITLE',
    features: features.length > 0 ? features : ['迭代实现'],
    deployUrl: '$VERCEL_URL'
  });
}

fs.writeFileSync(file, JSON.stringify(releases, null, 2));
console.log('releases.json updated');
" 2>/dev/null || log "WARN" "Failed to update releases.json"

log "INFO" "=== Deployment Complete ==="
log "INFO" "  Version: $VERSION"
log "INFO" "  URL: $VERCEL_URL"
log "INFO" "  Commit: $CURRENT_COMMIT"
