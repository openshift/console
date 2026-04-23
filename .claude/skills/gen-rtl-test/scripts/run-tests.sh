#!/bin/bash
#
# run-tests.sh - Execute tests with comprehensive validation
#
# This script:
# 1. Runs the test file with jest
# 2. Captures full output including warnings
# 3. Validates test results
# 4. Checks for act() warnings
# 5. Provides structured feedback
#
# Usage: ./run-tests.sh <test-file-path>
# Exit: 0 if tests pass with no warnings, 1 otherwise

set -euo pipefail

TEST_FILE="${1:-}"

if [ -z "$TEST_FILE" ]; then
  echo "Usage: $0 <test-file-path>"
  exit 1
fi

if [ ! -f "$TEST_FILE" ]; then
  echo "❌ Test file not found: $TEST_FILE"
  exit 1
fi

echo "Running tests: $TEST_FILE"
echo "=================================="

# Create temp file for output
TEMP_OUTPUT=$(mktemp)
trap "rm -f $TEMP_OUTPUT" EXIT

# Run tests and capture output
set +e
cd frontend 2>/dev/null || true
yarn test -- "$TEST_FILE" --no-coverage 2>&1 | tee "$TEMP_OUTPUT"
TEST_EXIT_CODE=${PIPESTATUS[0]}
set -e

echo ""
echo "=================================="
echo "Test Execution Results"
echo "=================================="

# ============================================================================
# Check 1: Test execution status
# ============================================================================
if [ "$TEST_EXIT_CODE" -eq 0 ]; then
  echo "✅ Tests PASSED"
else
  echo "❌ Tests FAILED (exit code: $TEST_EXIT_CODE)"
  echo ""
  echo "Review the output above for failure details."
  exit 1
fi

# ============================================================================
# Check 2: act() warnings
# ============================================================================
ACT_WARNINGS=$(grep -c "not wrapped in act" "$TEMP_OUTPUT" || echo "0")

if [ "$ACT_WARNINGS" -gt 0 ]; then
  echo "❌ Found $ACT_WARNINGS act() warning(s)"
  echo ""
  echo "act() warnings found:"
  grep -A 3 "not wrapped in act" "$TEMP_OUTPUT" || true
  echo ""
  echo "FIX: Use waitFor or findBy* queries for async updates"
  echo "See SKILL.md section \"Async Testing - Handle Updates Properly\""
  exit 1
else
  echo "✅ No act() warnings"
fi

# ============================================================================
# Check 3: Test suite summary
# ============================================================================
TEST_SUMMARY=$(grep "Test Suites:" "$TEMP_OUTPUT" || echo "")
TESTS_SUMMARY=$(grep "Tests:" "$TEMP_OUTPUT" || echo "")

echo ""
echo "Summary:"
echo "$TEST_SUMMARY"
echo "$TESTS_SUMMARY"

# ============================================================================
# Check 4: Console warnings/errors
# ============================================================================
CONSOLE_ERRORS=$(grep -c "console.error" "$TEMP_OUTPUT" || echo "0")
CONSOLE_WARNINGS=$(grep -c "console.warn" "$TEMP_OUTPUT" || echo "0")

if [ "$CONSOLE_ERRORS" -gt 0 ] || [ "$CONSOLE_WARNINGS" -gt 0 ]; then
  echo ""
  echo "⚠️  Console output detected:"
  echo "   Errors: $CONSOLE_ERRORS"
  echo "   Warnings: $CONSOLE_WARNINGS"
  echo ""
  echo "Review console output - may indicate issues with test implementation"
fi

echo ""
echo "=================================="
echo "✅ ALL VALIDATIONS PASSED"
echo "=================================="

exit 0
