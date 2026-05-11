#!/bin/bash
set -euo pipefail

# Evolution Engine Runner for en-learn
# Usage: ./scripts/evolution/run.sh
# Pure frontend project: React + Vite + Vercel

export PATH="/Users/litang/.local/bin:/Users/litang/.volta/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVOLUTION_DIR="$PROJECT_DIR/.claude/evolution"
STATE_FILE="$EVOLUTION_DIR/state.json"
PROMPTS_DIR="$EVOLUTION_DIR/prompts"
LOG_FILE="$EVOLUTION_DIR/log.txt"
DIRECTIVES_FILE="$EVOLUTION_DIR/directives.json"
INBOX_FILE="$EVOLUTION_DIR/INBOX.md"
REPLIES_FILE="$EVOLUTION_DIR/inbox/replies.json"

# Logging helper
log() {
  local level="$1"
  local message="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Read state value using jq (fallback to python if jq unavailable)
read_state() {
  local key="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r "$key" "$STATE_FILE" 2>/dev/null || echo "null"
  else
    node -e "const s = require('$STATE_FILE'); console.log(s.$key || 'null')" 2>/dev/null || echo "null"
  fi
}

# Read directives and format pending ones for injection into prompt
check_directives() {
  if [ ! -f "$DIRECTIVES_FILE" ]; then
    echo ""
    return
  fi
  local pending_count
  pending_count=$(jq '.pending | length' "$DIRECTIVES_FILE" 2>/dev/null || echo "0")
  if [ "$pending_count" == "0" ] || [ "$pending_count" == "null" ]; then
    echo ""
    return
  fi
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "🎯 STRATEGIC DIRECTIVES (pending: $pending_count)"
  echo "═══════════════════════════════════════════════════════════════"
  jq -r '.pending[] | "\n[\(.type)] \(.id)\n  Target: \(.target // "N/A")\n  Action: \(.action)\n  Reason: \(.reason // "No reason given")"' "$DIRECTIVES_FILE" 2>/dev/null || echo "  (Error reading directives)"
  echo ""
  echo "Instructions: Execute these directives during this stage if applicable."
  echo "After execution, move them to history and update state accordingly."
  echo "═══════════════════════════════════════════════════════════════"
}

# Process user replies from inbox/replies.json
process_inbox_replies() {
  if [ ! -f "$REPLIES_FILE" ]; then
    return
  fi
  local reply_count
  reply_count=$(jq '.replies | length' "$REPLIES_FILE" 2>/dev/null || echo "0")
  if [ "$reply_count" == "0" ] || [ "$reply_count" == "null" ]; then
    return
  fi
  log "INFO" "Processing $reply_count inbox replies"
  # Merge replies into state.pendingQuestions and clear replies file
  node -e "
    const fs = require('fs');
    const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
    const replies = JSON.parse(fs.readFileSync('$REPLIES_FILE', 'utf-8'));
    if (!state.pendingQuestions) state.pendingQuestions = [];
    replies.replies.forEach(r => {
      const q = state.pendingQuestions.find(q => q.id === r.questionId);
      if (q) {
        q.answer = r.answer;
        q.answeredAt = new Date().toISOString();
        q.blocking = false;
      }
    });
    // If all blocking questions are answered, resume
    const stillBlocking = state.pendingQuestions.filter(q => q.blocking && !q.answer).length;
    if (stillBlocking === 0 && state.status === 'AWAITING_INPUT') {
      state.status = state.resumedStatus || 'PLAN';
      delete state.resumedStatus;
      delete state.awaitingInputSince;
    }
    fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
    fs.writeFileSync('$REPLIES_FILE', JSON.stringify({ version: '1.0', replies: [] }, null, 2));
  " 2>/dev/null || true
}

# Update INBOX.md with current pending questions
update_inbox() {
  local questions_json
  questions_json=$(jq '.pendingQuestions // []' "$STATE_FILE" 2>/dev/null || echo "[]")
  local status_val
  status_val=$(jq -r '.status' "$STATE_FILE" 2>/dev/null || echo "UNKNOWN")
  local awaiting_since
  awaiting_since=$(jq -r '.awaitingInputSince // "null"' "$STATE_FILE" 2>/dev/null || echo "null")
  
  local waiting_text="无"
  local questions_block="_暂无_"
  
  if [ "$status_val" == "AWAITING_INPUT" ]; then
    waiting_text="是 ⏳"
  fi
  
  local q_count
  q_count=$(echo "$questions_json" | jq 'length')
  if [ "$q_count" != "0" ]; then
    questions_block=$(echo "$questions_json" | jq -r '
      map(
        "### Q\\(.id): \\(.question)\\n" +
        "- **阶段**: \\(.stage)\\n" +
        "- **阻塞**: \\(.blocking ? "是 🚫" : "否")\\n" +
        if .answer then "- **已回复**: \\(.answer)\\n" else "- **待回复**\\n" end +
        "\\n"
      ) | join("\\n")
    ')
  fi
  
  cat > "$INBOX_FILE" <<EOF
# 📬 Evolution Engine Inbox

> 这是 Agent 与人类的双向沟通信箱。
> 当 Agent 需要资源、确认或信息时，会在这里留下问题。
> 你回复后，Agent 会在下一个运行周期读取并继续工作。

## 当前状态

- **等待中**: $waiting_text
- **最后更新**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 如何回复

1. 查看下面的 **待回答问题**
2. 在 \`inbox/replies.json\` 中写入你的回复：
   \`\`\`json
   {
     "version": "1.0",
     "replies": [
       {
         "questionId": "q-001",
         "answer": "你的回答...",
         "repliedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
       }
     ]
   }
   \`\`\`
3. Agent 下次运行时会读取并继续

## 待回答问题 ($q_count)

$questions_block

---

*此文件由 Evolution Engine 自动生成，请勿手动修改问题部分。*
EOF
}

# State file health check & auto-backup
if [ -f "$STATE_FILE" ]; then
  if ! node -e "JSON.parse(require('fs').readFileSync('$STATE_FILE', 'utf-8'))" 2>/dev/null; then
    log "WARN" "state.json is corrupted. Attempting recovery from backup..."
    LATEST_BACKUP=$(ls -t "$EVOLUTION_DIR"/backup/state-*.json 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
      cp "$LATEST_BACKUP" "$STATE_FILE"
      log "INFO" "Recovered state from $LATEST_BACKUP"
    else
      log "ERROR" "No backup found. State file corrupted."
      exit 1
    fi
  else
    # Create timestamped backup before each run
    mkdir -p "$EVOLUTION_DIR/backup"
    BACKUP_FILE="$EVOLUTION_DIR/backup/state-$(date +%Y-%m-%d-%H%M%S).json"
    cp "$STATE_FILE" "$BACKUP_FILE"
    # Keep only last 10 backups
    ls -t "$EVOLUTION_DIR"/backup/state-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
  fi
fi

# Read state
STATUS=$(read_state '.status')
CYCLE_COUNT=$(read_state '.cycleCount // 0')
FAILED_ATTEMPTS=$(read_state '.failedAttempts // 0')

# Check pause after failed cycles (high threshold, effectively disabled)
PAUSE_AFTER_FAIL=$(read_state '.config.pauseAfterFailedCycles // 999')
if [ "$FAILED_ATTEMPTS" -ge "$PAUSE_AFTER_FAIL" ]; then
  log "WARN" "Paused after $FAILED_ATTEMPTS consecutive failures. Manual reset required."
  exit 1
fi

# Process any inbox replies first
process_inbox_replies

# Handle AWAITING_INPUT state
if [ "$STATUS" == "AWAITING_INPUT" ]; then
  update_inbox
  log "INFO" "Status is AWAITING_INPUT. Pausing for human response. Check $INBOX_FILE"
  exit 0
fi

# Determine which stage to execute
if [ "$STATUS" == "null" ] || [ "$STATUS" == "IDLE" ]; then
  # Check if there's an active Epic with pending iterations
  EPIC_PENDING=$(node -e "
    const fs = require('fs');
    const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
    const epic = state.currentEpic;
    if (!epic || !epic.iterations) { console.log('0'); process.exit(0); }
    const pending = epic.iterations.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
    console.log(pending);
  " 2>/dev/null || echo "0")

  if [ "$EPIC_PENDING" -gt 0 ]; then
    log "INFO" "Resuming Epic with $EPIC_PENDING pending iterations. Skipping BRAINSTORM."
    node -e "
      const fs = require('fs');
      const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
      state.status = 'PLAN';
      if (!state.currentCycle) {
        state.currentCycle = {
          id: '$(date +%Y-%m-%d)-' + (state.cycleCount + 1),
          mode: state.nextMode || 'vision',
          stage: 'PLAN',
          startedAt: new Date().toISOString()
        };
      } else {
        state.currentCycle.stage = 'PLAN';
      }
      fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
    "
    STATUS="PLAN"
  else
    # Start a new cycle
    NEXT_MODE=$(read_state '.nextMode // "vision"')
    if [ "$((CYCLE_COUNT % 4))" -eq 0 ] && [ "$CYCLE_COUNT" -gt 0 ]; then
      NEXT_MODE="tech-review"
    fi

    # Determine starting stage based on mode
    if [ "$NEXT_MODE" == "tech-review" ]; then
      START_STAGE="TECH_REVIEW"
    else
      START_STAGE="BRAINSTORM"
    fi

    # Update state to starting status
    node -e "
      const fs = require('fs');
      const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
      state.status = '$START_STAGE';
      state.currentCycle = {
        id: '$(date +%Y-%m-%d)-' + (state.cycleCount + 1),
        mode: '$NEXT_MODE',
        stage: '$START_STAGE',
        startedAt: new Date().toISOString()
      };
      fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
    "
    STATUS="$START_STAGE"
    log "INFO" "Starting new cycle: ${NEXT_MODE} (stage: ${START_STAGE})"
  fi
fi

# Continuous execution loop
while true; do
  STATUS=$(read_state '.status')

  if [ "$STATUS" == "IDLE" ] || [ "$STATUS" == "null" ]; then
    log "INFO" "Cycle complete (status: $STATUS). Exiting continuous loop."
    break
  fi

  case "$STATUS" in
    BRAINSTORM)   PROMPT_FILE="$PROMPTS_DIR/brainstorm.md" ;;
    PLAN)         PROMPT_FILE="$PROMPTS_DIR/plan.md" ;;
    IMPLEMENT)    PROMPT_FILE="$PROMPTS_DIR/implement.md" ;;
    TEST)         PROMPT_FILE="$PROMPTS_DIR/test.md" ;;
    AUTO_FIX)     PROMPT_FILE="$PROMPTS_DIR/auto-fix.md" ;;
    COMMIT)       PROMPT_FILE="$PROMPTS_DIR/commit.md" ;;
    DEPLOY)       PROMPT_FILE="$PROMPTS_DIR/deploy.md" ;;
    REPORT)       PROMPT_FILE="$PROMPTS_DIR/report.md" ;;
    TECH_REVIEW)  PROMPT_FILE="$PROMPTS_DIR/tech-review.md" ;;
    CLEANUP)      PROMPT_FILE="$PROMPTS_DIR/cleanup.md" ;;
    *)
      log "ERROR" "Unknown status: $STATUS"
      exit 1
      ;;
  esac

  if [ ! -f "$PROMPT_FILE" ]; then
    log "ERROR" "Prompt file not found: $PROMPT_FILE"
    exit 1
  fi

  log "INFO" "Executing stage: $STATUS"

  # Check for strategic directives to inject
  DIRECTIVES_SECTION=$(check_directives)

  # Read pending questions for context
  PENDING_QUESTIONS=$(jq -r '.pendingQuestions // [] | map("- [\(.id)] \(.stage): \(.question) (blocking: \(.blocking))") | join("\n")' "$STATE_FILE" 2>/dev/null || echo "")
  if [ -n "$PENDING_QUESTIONS" ]; then
    PENDING_QUESTIONS="Pending questions from previous stages:\n${PENDING_QUESTIONS}\nIf any are blocking and answered, resolve them now."
  fi

  MASTER_PROMPT=$(cat <<EOF
You are the Evolution Engine for the en-learn project.

Current stage: $STATUS
Cycle mode: $(read_state '.currentCycle.mode // "vision"')
Cycle ID: $(read_state '.currentCycle.id // "unknown"')

Working directory: $PROJECT_DIR

Please read the stage-specific prompt from:
$PROMPT_FILE

Then execute the instructions in that prompt file. After completing the stage:
1. Update \`$STATE_FILE\` with the new status
2. If the stage succeeded, advance to the next stage
3. If the stage failed, increment failedAttempts and stay or retry

Project context:
- This is a pure frontend React + Vite English vocabulary learning app
- Tests: vitest unit tests, playwright e2e tests
- Deploy: Vercel static hosting
- Evolution state and logs are in \`$EVOLUTION_DIR\`
- Do NOT delete or modify any files in \`$EVOLUTION_DIR\` or \`docs/\`
- Commit messages must start with \`[EVOLUTION]\`

═══════════════════════════════════════════════════════════════
🔄 BIDIRECTIONAL COMMUNICATION PROTOCOL
═══════════════════════════════════════════════════════════════

You MUST follow this protocol when you need human input:

1. If you encounter ANY of these situations, STOP and ask:
   - Missing credentials, API keys, tokens, or environment variables
   - Missing design assets, mock data, or external resources
   - Unclear requirements that affect implementation decisions
   - Need user confirmation before destructive operations
   - Deployment blocked by missing config (Vercel token, domain, etc.)

2. To ask a question, write to \`$STATE_FILE\`:
   ```json
   {
     "status": "AWAITING_INPUT",
     "resumedStatus": "<the stage to return to>",
     "awaitingInputSince": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
     "pendingQuestions": [
       {
         "id": "q-001",
         "stage": "$STATUS",
         "question": "具体问题描述，要清晰、可回答",
         "blocking": true,
         "context": "为什么需要这个信息",
         "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
       }
     ]
   }
   ```

3. Do NOT make up credentials, mock production configs, or guess user intent.
4. Do NOT silently skip deployment if it requires human-provided tokens.

If all questions are non-blocking, you may proceed but still log them.

$PENDING_QUESTIONS
═══════════════════════════════════════════════════════════════
$DIRECTIVES_SECTION
EOF
)

  cd "$PROJECT_DIR"
  # Use launchctl asuser to preserve macOS Keychain auth context in launchd environment
  echo "$MASTER_PROMPT" | launchctl asuser $(id -u) /Users/litang/.local/bin/claude -p --dangerously-skip-permissions

  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    log "ERROR" "Claude execution failed with exit code $EXIT_CODE at stage $STATUS"
    node -e "
      const fs = require('fs');
      const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
      state.failedAttempts = (state.failedAttempts || 0) + 1;
      fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
    "
    exit $EXIT_CODE
  fi

  # Validate state.json after Agent writes (before next loop iteration)
  if ! node -e "JSON.parse(require('fs').readFileSync('$STATE_FILE', 'utf-8'))" 2>/dev/null; then
    log "WARN" "state.json corrupted after $STATUS, recovering..."
    LATEST_BACKUP=$(ls -t "$EVOLUTION_DIR"/backup/state-*.json 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
      cp "$LATEST_BACKUP" "$STATE_FILE"
      log "INFO" "Recovered from $LATEST_BACKUP"
    fi
  fi

  log "INFO" "Stage $STATUS completed successfully"

  NEW_STATUS=$(read_state '.status')
  if [ "$NEW_STATUS" == "$STATUS" ]; then
    log "WARN" "Status did not advance after stage $STATUS (still $NEW_STATUS). Stopping loop."
    break
  fi

  # Epic Sprint: after REPORT returns to IDLE, check if currentEpic has pending iterations
  if [ "$NEW_STATUS" == "IDLE" ] || [ "$NEW_STATUS" == "null" ]; then
    EPIC_PENDING=$(node -e "
      const fs = require('fs');
      const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
      const epic = state.currentEpic;
      if (!epic || !epic.iterations) { console.log('0'); process.exit(0); }
      const pending = epic.iterations.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
      console.log(pending);
    " 2>/dev/null || echo "0")
    if [ "$EPIC_PENDING" -gt 0 ]; then
      log "INFO" "Epic has $EPIC_PENDING pending iterations. Continuing to next iteration PLAN."
      node -e "
        const fs = require('fs');
        const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf-8'));
        state.status = 'PLAN';
        fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
      "
      continue
    fi
  fi

done
