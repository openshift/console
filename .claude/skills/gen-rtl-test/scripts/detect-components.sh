#!/bin/bash
#
# detect-components.sh - Detect React components from git diff
#
# This script provides deterministic component detection logic.
# It's called by the skill but runs independently for consistency.
#
# Usage: ./detect-components.sh
# Output: JSON array of component file paths

set -euo pipefail

# Get git diff
GIT_DIFF=$(git diff --name-only HEAD 2>/dev/null || echo "")

if [ -z "$GIT_DIFF" ]; then
  echo "[]"
  exit 0
fi

# Filter for React components
COMPONENTS=()

while IFS= read -r file; do
  # Must be .tsx or .jsx
  if [[ ! "$file" =~ \.(tsx|jsx)$ ]]; then
    continue
  fi

  # Exclude test files
  if [[ "$file" =~ \.(spec|test)\.(tsx|jsx)$ ]]; then
    continue
  fi

  # Exclude __tests__, __mocks__ directories
  if [[ "$file" =~ __tests__/|__mocks__/ ]]; then
    continue
  fi

  # Exclude type files
  if [[ "$file" =~ \.types\.(ts|tsx)$ ]]; then
    continue
  fi

  # Exclude common non-component patterns
  if [[ "$file" =~ (utils|helpers|constants|types|models)\.(tsx?|jsx?)$ ]]; then
    continue
  fi

  # Check if file actually contains React component
  if [ -f "$file" ]; then
    if grep -qE "(export (const|default|function)|class .* extends React\.Component)" "$file"; then
      COMPONENTS+=("$file")
    fi
  fi
done <<< "$GIT_DIFF"

# Output as JSON array
if [ ${#COMPONENTS[@]} -eq 0 ]; then
  echo "[]"
else
  printf '%s\n' "${COMPONENTS[@]}" | jq -R . | jq -s .
fi
