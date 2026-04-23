#!/usr/bin/env bash
# Claude Code PreToolUse hook: enforce RTL test file constraints on Write / Edit.
# Protocol: https://docs.anthropic.com/en/docs/claude-code/hooks
#
# Applies only to paths under __tests__/ matching *.spec.* / *.test.* (limits blast radius).

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=""
if [[ "$TOOL_NAME" == "Write" ]]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // ""')
else
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // ""')
fi

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

if [[ ! "$FILE_PATH" =~ __tests__/ ]] || [[ ! "$FILE_PATH" =~ \.(spec|test)\.(tsx?|jsx?|ts|js)$ ]]; then
  exit 0
fi

deny() {
  local reason=$1
  jq -n \
    --arg reason "$reason" \
    '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
      }
    }'
  exit 0
}

if [[ ! "$FILE_PATH" =~ \.spec\. ]]; then
  deny "Test file must use .spec.* extension (not .test.*): ${FILE_PATH}"
fi

if node -e 'process.exit(/(?<!jest\.)require\s*\(/.test(process.argv[1]) ? 0 : 1)' "$CONTENT" 2>/dev/null; then
  deny "Test file must use ES6 import (no require() except jest.requireActual): ${FILE_PATH}"
fi

if echo "$CONTENT" | grep -q 'expect\.anything()'; then
  deny "Test file must not use expect.anything(): ${FILE_PATH}"
fi

exit 0
