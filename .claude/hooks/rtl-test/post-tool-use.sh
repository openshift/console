#!/bin/bash
# Post-tool-use hook: Auto-lint and validate test files after Write/Edit
# This hook is triggered by Claude Code after writing or editing test files.
#
# Usage: Called automatically by Claude Code via settings.json hooks configuration
#
# Exit codes:
#   0 - Success (no blocking violations)
#   1 - Blocked (critical violations found)

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

# shellcheck source=rtl-must-haves.sh
source "$SCRIPT_DIR/rtl-must-haves.sh"

echo "========================================"
echo "Post-Tool-Use Hook: Validating Test File"
echo "========================================"
echo "File: $FILE_PATH"
echo ""

ERRORS=0

# -----------------------------------------------------------------------------
# BLOCKING VIOLATIONS (shared with pre-tool-use: rtl-must-haves.sh)
# -----------------------------------------------------------------------------

run_rtl_must_have_checks "$FILE_PATH"
ERRORS=$((ERRORS + RTL_MUST_HAVE_VIOLATIONS))

# -----------------------------------------------------------------------------
# ESLint (blocking — matches CI: frontend uses --max-warnings 0 on full lint)
# NOTE: --fix modifies the file on disk (auto-fixes formatting/simple rules),
#       so the file may differ from what was originally written.
# -----------------------------------------------------------------------------

if [[ -f "$FRONTEND_DIR/package.json" ]]; then
    # Make path relative to frontend for eslint
    REL_PATH="${FILE_PATH#$FRONTEND_DIR/}"
    if [[ "$REL_PATH" != "$FILE_PATH" ]]; then
        echo "Running ESLint (autofix + same gate as CI: 0 errors, 0 warnings)..."
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
    fi
fi

# -----------------------------------------------------------------------------
# Jest Tests (blocking — tests must pass)
# -----------------------------------------------------------------------------

if [[ -f "$FRONTEND_DIR/package.json" ]]; then
    REL_PATH="${FILE_PATH#$FRONTEND_DIR/}"
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
    echo "RESULT: BLOCKED ($ERRORS critical violations)"
    echo "Fix the errors above before proceeding."
    exit 1
else
    echo "RESULT: PASSED"
    exit 0
fi
