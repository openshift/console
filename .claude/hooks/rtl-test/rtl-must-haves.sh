# Shared RTL "must have" / anti-pattern checks for unit test files.
# Source from this directory:
#   SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
#   # shellcheck source=rtl-must-haves.sh
#   source "$SCRIPT_DIR/rtl-must-haves.sh"
# Then: run_rtl_must_have_checks "$file"
# On return, RTL_MUST_HAVE_VIOLATIONS is the number of failed rule groups (0–6).

# shellcheck disable=SC2034

run_rtl_must_have_checks() {
  local FILE_PATH="${1:-}"
  RTL_MUST_HAVE_VIOLATIONS=0
  if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
    return 0
  fi

  # 1) No require() except jest.requireActual
  if grep -E "require\s*\(" "$FILE_PATH" 2>/dev/null | grep -v "jest.requireActual" | grep -q .; then
    echo "BLOCKED: require() found in test file."
    echo "  Use ES6 imports only. See SKILL.md Rule: ES6 Imports Only"
    echo ""
    grep -n "require(" "$FILE_PATH" | grep -v "jest.requireActual" | head -5
    echo ""
    RTL_MUST_HAVE_VIOLATIONS=$((RTL_MUST_HAVE_VIOLATIONS + 1))
  fi

  # 2) No expect.anything()
  if grep -q "expect\.anything()" "$FILE_PATH" 2>/dev/null; then
    echo "BLOCKED: expect.anything() found."
    echo "  Use specific assertions. See SKILL.md Rule 24"
    echo ""
    grep -n "expect.anything()" "$FILE_PATH" | head -5
    echo ""
    RTL_MUST_HAVE_VIOLATIONS=$((RTL_MUST_HAVE_VIOLATIONS + 1))
  fi

  # 3) No container.querySelector
  if grep -q "container\.querySelector" "$FILE_PATH" 2>/dev/null; then
    echo "BLOCKED: container.querySelector found."
    echo "  Use RTL queries (getByRole, getByText, etc.) instead."
    echo ""
    grep -n "container.querySelector" "$FILE_PATH" | head -5
    echo ""
    RTL_MUST_HAVE_VIOLATIONS=$((RTL_MUST_HAVE_VIOLATIONS + 1))
  fi

  # 4) No fireEvent — use userEvent
  if grep -q "fireEvent\." "$FILE_PATH" 2>/dev/null; then
    echo "BLOCKED: fireEvent found."
    echo "  Use userEvent instead for realistic user behavior simulation."
    echo "  Use: import userEvent from '@testing-library/user-event'"
    echo ""
    grep -n "fireEvent\." "$FILE_PATH" | head -5
    echo ""
    RTL_MUST_HAVE_VIOLATIONS=$((RTL_MUST_HAVE_VIOLATIONS + 1))
  fi

  # 5) No destructuring queries from render — use screen
  if grep -E "const \{.*\} = render" "$FILE_PATH" 2>/dev/null | grep -v "store\|pluginStore" | grep -q .; then
    echo "BLOCKED: Destructuring queries from render()."
    echo "  Use screen.* queries for consistency."
    echo "  See SKILL.md Rule 5: Always Use screen for Queries"
    echo ""
    grep -E -n "const \{.*\} = render" "$FILE_PATH" | head -5
    echo ""
    RTL_MUST_HAVE_VIOLATIONS=$((RTL_MUST_HAVE_VIOLATIONS + 1))
  fi

  # 6) No toMatchSnapshot() or toMatchInlineSnapshot() — snapshots are brittle
  if grep -qE "toMatch(Inline)?Snapshot\(" "$FILE_PATH" 2>/dev/null; then
    echo "BLOCKED: Snapshot assertion found."
    echo "  Snapshot tests are brittle and test implementation details."
    echo "  See SKILL.md Rule 18: Avoid Snapshot Tests"
    echo ""
    grep -nE "toMatch(Inline)?Snapshot\(" "$FILE_PATH" | head -5
    echo ""
    RTL_MUST_HAVE_VIOLATIONS=$((RTL_MUST_HAVE_VIOLATIONS + 1))
  fi

  return 0
}
