#!/usr/bin/env bash
# Claude Code UserPromptSubmit hook: inject git-diff component hints for /gen-rtl-test.
# Protocol: https://docs.anthropic.com/en/docs/claude-code/hooks

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')

if ! echo "$PROMPT" | grep -qiE 'gen-rtl-test|/gen-rtl-test'; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT" || exit 0

CTX=""
if GIT_FILES=$(git diff --name-only HEAD 2>/dev/null); then
  COMPONENTS=()
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ "$file" =~ \.(tsx|jsx)$ ]] || continue
    [[ "$file" =~ \.(spec|test)\.(tsx|jsx)$ ]] && continue
    if [[ "$file" == *"__tests__/"* ]] || [[ "$file" == *"__mocks__/"* ]]; then
      continue
    fi
    [[ "$file" =~ \.types\.(ts|tsx)$ ]] && continue
    [[ "$file" =~ (utils|helpers|constants|types|models)\.(tsx?|jsx?)$ ]] && continue
    COMPONENTS+=("$file")
  done <<< "$GIT_FILES"

  if ((${#COMPONENTS[@]} > 0)); then
    CTX+=$'\n<git-diff-components>\nModified React components (git diff vs HEAD):\n'
    for i in "${!COMPONENTS[@]}"; do
      CTX+=$'\n['"$((i + 1))"'] '"${COMPONENTS[$i]}"
    done
    CTX+=$'\n\nUse when no explicit component path is given.\n</git-diff-components>\n'
  fi
fi

UTIL1="$ROOT/frontend/packages/console-shared/src/test-utils/unit-test-utils.tsx"
UTIL2="$ROOT/packages/console-shared/src/test-utils/unit-test-utils.tsx"
if [[ -f "$UTIL1" || -f "$UTIL2" ]]; then
  CTX+=$'\n<available-test-utilities>\nverifyInputField: @console/shared/src/test-utils/unit-test-utils\n</available-test-utilities>\n'
fi

if [[ -z "$CTX" ]]; then
  exit 0
fi

jq -n --arg ctx "$CTX" '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
