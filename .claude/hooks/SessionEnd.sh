#!/bin/bash
# SessionEnd hook - Automatically capture work context when session ends
# This runs whenever Claude Code session ends (exit, logout, etc.)
#
# Receives JSON data via stdin with fields:
#   - session_id: Unique session identifier
#   - transcript_path: Path to full conversation JSON
#   - cwd: Working directory
#   - permission_mode: Current permission mode
#   - hook_event_name: Name of the hook event

# Read JSON data passed from Claude Code via stdin
CLAUDE_DATA=$(cat)

# Get current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

# Check if we're on a work branch (matches CONSOLE-* or OCPBUGS-* pattern)
if [[ ! "$CURRENT_BRANCH" =~ ^(CONSOLE|OCPBUGS)-[0-9]+ ]]; then
    # Not on a work branch, nothing to capture
    exit 0
fi

# Extract issue key from branch name
ISSUE_KEY=$(echo "$CURRENT_BRANCH" | grep -oE '(CONSOLE|OCPBUGS)-[0-9]+')

# Create context directory if it doesn't exist
mkdir -p ~/.claude/work-context

# Parse JSON to extract session_id and transcript path
SESSION_ID=$(echo "$CLAUDE_DATA" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('session_id', ''))" 2>/dev/null)
TRANSCRIPT_PATH=$(echo "$CLAUDE_DATA" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('transcript_path', ''))" 2>/dev/null)

# Check if context was already captured during this session
WORK_CONTEXT_FILE=~/.claude/work-context.md
if [ -f "$WORK_CONTEXT_FILE" ]; then
    # Check if this session_id was already captured
    LAST_CAPTURED_SESSION=$(grep "^**Last Captured Session**:" "$WORK_CONTEXT_FILE" | head -1 | sed 's/^\*\*Last Captured Session\*\*: //')

    if [ "$LAST_CAPTURED_SESSION" = "$SESSION_ID" ]; then
        # Context already captured during /do session, no need for pending file
        exit 0
    fi
fi

# Get timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Gather git data
MODIFIED_FILES=$(git status --porcelain 2>/dev/null)
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null)
BRANCH_COMMITS=$(git log master..HEAD --oneline 2>/dev/null)
GIT_STATUS=$(git status --short 2>/dev/null)

# Check if there are any changes to capture
if [ -z "$GIT_STATUS" ] && [ -z "$RECENT_COMMITS" ] && [ -z "$CLAUDE_DATA" ]; then
    # No changes to capture
    exit 0
fi

# Save session metadata JSON to separate file
JSON_FILENAME="session-${SESSION_ID:-$(date +%s)}.json"
JSON_FILE=~/.claude/work-context/$JSON_FILENAME
if [ -n "$CLAUDE_DATA" ]; then
    echo "$CLAUDE_DATA" > "$JSON_FILE"
fi

# Create markdown session entry
PENDING_FILE=~/.claude/work-context-pending.md
cat > "$PENDING_FILE" <<EOF
### $TIMESTAMP - $ISSUE_KEY
**Session captured on exit**

**Files Modified**:
$(echo "$MODIFIED_FILES" | awk '{if (length($0) > 3) print "- " substr($0, 4)}')

**Recent Commits**:
$(echo "$RECENT_COMMITS" | sed 's/^/- /')

**Branch Commits** (vs master):
$(echo "$BRANCH_COMMITS" | sed 's/^/- /')

**Session Metadata**: \`$JSON_FILE\`

**Transcript Path**: \`$TRANSCRIPT_PATH\`

**Captured By**: SessionEnd hook

---

EOF

# Exit successfully
exit 0
