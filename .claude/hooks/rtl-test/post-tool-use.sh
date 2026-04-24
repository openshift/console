#!/bin/bash
# Post-tool-use hook: Run ESLint and Jest on the touched test file after Write/Edit.
# Triggered by Claude Code via .claude/settings.json.
#
# Lint policy uses the repo ESLint config only (no parallel grep rules) so feedback
# stays aligned with CI, pre-commit, and `yarn eslint <file>`.
#
# Exit codes:
#   0 - Success (lint/tests passed, or path skipped — not under frontend/)
#   1 - ESLint or Jest failed

set -euo pipefail

TOOL_NAME="${1:-}"
FILE_PATH="${2:-}"

# Only process Write/Edit operations on test files
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
    exit 0
fi

if [[ ! "$FILE_PATH" =~ \.(spec|test)\.[tj]sx?$ ]]; then
    exit 0
fi

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"

# Normalize FILE_PATH to absolute, anchored at REPO_ROOT (not process cwd), so ESLint/Jest
# paths match when the tool passes repo-relative paths like frontend/.../file.spec.tsx.
if [[ "$FILE_PATH" != /* ]]; then
    FILE_PATH="$REPO_ROOT/${FILE_PATH#./}"
fi

echo "========================================"
echo "Post-Tool-Use Hook: Validating Test File"
echo "========================================"
echo "File: $FILE_PATH"
echo ""

ERRORS=0

SKIPPED_OUTSIDE_FRONTEND=0

# -----------------------------------------------------------------------------
# ESLint (blocking — matches CI spirit: --max-warnings 0)
# NOTE: --fix modifies the file on disk.
# -----------------------------------------------------------------------------

if [[ -f "$FRONTEND_DIR/package.json" ]]; then
    REL_PATH="${FILE_PATH#"$FRONTEND_DIR"/}"
    if [[ "$REL_PATH" != "$FILE_PATH" ]]; then
        echo "Running ESLint (autofix + 0 errors, 0 warnings)..."
        cd "$FRONTEND_DIR"
        if ! yarn eslint "$REL_PATH" --fix --max-warnings 0; then
            echo ""
            echo "BLOCKED: ESLint failed (issues remain after --fix, or unfixable violations)."
            echo "  Run: cd frontend && yarn eslint $REL_PATH --max-warnings 0"
            echo ""
            ERRORS=$((ERRORS + 1))
        else
            echo "ESLint: OK"
        fi
        echo ""
    elif [[ -f "$FILE_PATH" ]]; then
        echo "Skipping ESLint/Jest: file is not under frontend/ ($FILE_PATH)"
        echo ""
        SKIPPED_OUTSIDE_FRONTEND=1
    fi
fi

# -----------------------------------------------------------------------------
# Jest (blocking — tests must pass)
# -----------------------------------------------------------------------------

if [[ -f "$FRONTEND_DIR/package.json" ]]; then
    REL_PATH="${FILE_PATH#"$FRONTEND_DIR"/}"
    if [[ "$REL_PATH" != "$FILE_PATH" && -f "$FRONTEND_DIR/$REL_PATH" ]]; then
        echo "Running Jest tests..."
        cd "$FRONTEND_DIR"
        if ! yarn test "$REL_PATH" --no-coverage --passWithNoTests 2>&1; then
            echo ""
            echo "BLOCKED: Jest tests failed."
            echo "  Run: cd frontend && yarn test $REL_PATH"
            echo ""
            ERRORS=$((ERRORS + 1))
        else
            echo "Jest: OK"
        fi
        echo ""
    fi
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------

echo "========================================"
if [[ $ERRORS -gt 0 ]]; then
    echo "RESULT: BLOCKED ($ERRORS step(s) failed)"
    echo "Fix the errors above before proceeding."
    exit 1
elif [[ $SKIPPED_OUTSIDE_FRONTEND -eq 1 ]]; then
    echo "RESULT: SKIPPED (not a frontend test path — ESLint/Jest not run)"
    exit 0
else
    echo "RESULT: PASSED"
    exit 0
fi
