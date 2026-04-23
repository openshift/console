#!/bin/bash
#
# validate-test.sh - Comprehensive test file validation
#
# Checks for:
# 1. require() violations (except jest.requireActual)
# 2. expect.anything() usage
# 3. Correct file naming and location
# 4. Test count (5-10 tests)
# 5. Import violations
#
# Usage: ./validate-test.sh <test-file-path>
# Exit: 0 if valid, 1 if violations found

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

VIOLATIONS=0

echo "Validating: $TEST_FILE"
echo "=================================="

# ============================================================================
# CHECK 1: require() violations (except jest.requireActual)
# ============================================================================
echo -n "Checking for require() violations... "
if grep -n "require(" "$TEST_FILE" | grep -v "jest.requireActual" > /dev/null 2>&1; then
  echo "❌ FAILED"
  echo ""
  echo "Found require() calls (line numbers):"
  grep -n "require(" "$TEST_FILE" | grep -v "jest.requireActual" || true
  echo ""
  echo "FIX: Replace all require() with ES6 imports"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ PASSED"
fi

# ============================================================================
# CHECK 2: expect.anything() violations
# ============================================================================
echo -n "Checking for expect.anything()... "
if grep -n "expect\.anything()" "$TEST_FILE" > /dev/null 2>&1; then
  echo "❌ FAILED"
  echo ""
  echo "Found expect.anything() (line numbers):"
  grep -n "expect\.anything()" "$TEST_FILE" || true
  echo ""
  echo "FIX: Use specific matchers (expect.any(Type), expect.objectContaining, etc.)"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ PASSED"
fi

# ============================================================================
# CHECK 3: File naming and location
# ============================================================================
echo -n "Checking file location (__tests__ directory)... "
if [[ "$TEST_FILE" =~ /__tests__/ ]]; then
  echo "✅ PASSED"
else
  echo "❌ FAILED"
  echo "FIX: Test files must be in __tests__/ directory"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

echo -n "Checking file extension (.spec.tsx)... "
if [[ "$TEST_FILE" =~ \.spec\.(tsx|ts|jsx|js)$ ]]; then
  echo "✅ PASSED"
else
  echo "❌ FAILED"
  echo "FIX: Use .spec.tsx extension (not .test.tsx)"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# ============================================================================
# CHECK 4: Test count (5-10 tests)
# ============================================================================
echo -n "Checking test count (5-10)... "
TEST_COUNT=$(grep -cE "^\s*it\s*\(" "$TEST_FILE" || echo "0")

if [ "$TEST_COUNT" -ge 5 ] && [ "$TEST_COUNT" -le 10 ]; then
  echo "✅ PASSED ($TEST_COUNT tests)"
elif [ "$TEST_COUNT" -lt 5 ]; then
  echo "⚠️  WARNING ($TEST_COUNT tests - minimum 5 recommended)"
  echo "RECOMMENDATION: Add more tests to cover critical functionality"
else
  echo "⚠️  WARNING ($TEST_COUNT tests - maximum 10 recommended)"
  echo "RECOMMENDATION: Focus on 5-10 high-value tests, remove redundant ones"
fi

# ============================================================================
# CHECK 5: Unused imports (React import in test files)
# ============================================================================
echo -n "Checking for unused React import... "
if grep -q "^import React" "$TEST_FILE" && ! grep -q "React\." "$TEST_FILE"; then
  echo "⚠️  WARNING"
  echo "React is imported but not used - modern JSX doesn't need React import"
  echo "RECOMMENDATION: Remove unused React import"
else
  echo "✅ PASSED"
fi

# ============================================================================
# CHECK 6: Form field testing with verifyInputField
# ============================================================================
echo -n "Checking form field testing pattern... "
if grep -qE "getByLabelText.*type|getByLabelText.*value" "$TEST_FILE"; then
  if ! grep -q "verifyInputField" "$TEST_FILE"; then
    echo "⚠️  WARNING"
    echo "Manual form field assertions found - consider using verifyInputField utility"
    echo "RECOMMENDATION: Use verifyInputField for comprehensive form field testing"
  else
    echo "✅ PASSED (using verifyInputField)"
  fi
else
  echo "✅ N/A (no form fields detected)"
fi

# ============================================================================
# Summary
# ============================================================================
echo "=================================="
if [ "$VIOLATIONS" -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  exit 0
else
  echo "❌ $VIOLATIONS CRITICAL VIOLATION(S) FOUND"
  echo ""
  echo "Fix all violations before proceeding."
  exit 1
fi
