---
name: debug-e2e
description: Debug and fix failing Playwright e2e tests with MCP-assisted diagnosis. Use when user says "playwright test failing", "fix e2e test", "debug spec", or provides a failing .spec.ts file, e2e directory, or Playwright tag.
argument-hint: "<path/to/file.spec.ts | directory/ | @tag>"
allowed-tools: Read, Write, Edit, Bash(find *), Bash(grep *), Bash(ls *), Bash(npx tsc *), Bash(npx playwright *), Bash(git diff *), Bash(git status), mcp__plugin_playwright_playwright__browser_navigate, mcp__plugin_playwright_playwright__browser_snapshot, mcp__plugin_playwright_playwright__browser_click, mcp__plugin_playwright_playwright__browser_console_messages, mcp__plugin_playwright_playwright__browser_take_screenshot, mcp__plugin_playwright_playwright__browser_resize, mcp__plugin_playwright_playwright__browser_run_code_unsafe, mcp__plugin_playwright_playwright__browser_evaluate, mcp__plugin_playwright_playwright__browser_close, mcp__plugin_playwright_playwright__browser_type, mcp__plugin_playwright_playwright__browser_wait_for, mcp__plugin_playwright_playwright__browser_network_requests, AskUserQuestion
---

# Debug E2E

Debug and fix failing Playwright tests using MCP as the primary diagnostic tool. Works for a single spec, a directory, or a tag. Merged from [openshift-ui-tests-template/debug-e2e.md](https://github.com/bmaio-redhat/openshift-ui-tests-template/blob/main/.cursor/commands/debug-e2e.md) and [test-fix-cycle.md](https://github.com/bmaio-redhat/openshift-ui-tests-template/blob/main/.cursor/commands/test-fix-cycle.md).

## Before Starting

1. Check that `frontend/e2e/.env` exists. If missing, copy `frontend/e2e/.env.example` to `frontend/e2e/.env` and tell the user to fill in their cluster values before continuing.
2. Read `.claude/migration-context.md` for the Console architecture, selector mappings, and migration rules. That file is the single source of truth for how Playwright tests should be structured.

## Input

- **Spec file**: `/debug-e2e e2e/tests/console/cluster-settings/upstream-modal.spec.ts`
- **Test name**: `/debug-e2e "Verify console login"`
- **Directory**: `/debug-e2e e2e/tests/helm/`
- **Project**: `/debug-e2e --project=helm`
- **Optional workers**: append `--workers=N` (default: 4)

Examples:

```text
/debug-e2e e2e/tests/console/cluster-settings/upstream-modal.spec.ts
/debug-e2e e2e/tests/helm/ --workers=2
/debug-e2e --project=topology
```

## Workflow

### Phase 1: Run

1. Build command from input:
   - File: `npx playwright test <file> --retries=0 --workers=1 --reporter=list`
   - Directory: `npx playwright test <directory> --retries=0 --workers=<N> --reporter=list`
   - Project: `npx playwright test --project=<name> --retries=0 --workers=<N> --reporter=list`
   - For developer tests: `npx playwright test --project=<name>-developer --retries=0 --workers=1 --reporter=list`
2. Run and capture output
3. If all pass: report success. If single file, run 2 more times to confirm stability. Done.
4. Parse failures: test name, file path, error message

### Phase 2: Diagnose

For each failure, use MCP to identify root cause:

1. Resize viewport to 1920×1080
2. Navigate to the failing page
3. Snapshot accessibility tree — compare with test selectors
4. Interact — reproduce the failing action
5. Check console errors and network failures
6. Classify: Selector Changed, Timing Issue, API/Auth Failure, Functional Regression, Test Code Bug

### Phase 3: Fix

For each fixable failure, in priority order:

1. **Import/type errors** first — may cause cascading failures
2. **Stale selectors** — use MCP snapshot to find correct selector
3. **Timing issues** — add `robustClick()` or `waitForLoadingComplete()`
4. **Missing awaits** — add `await`
5. **Functional regressions** — `test.skip(true, 'reason')` after confirming with MCP

Fix in the correct layer: selectors and waits in page objects, assertions in test files. Never put locators directly in test files when a page object exists.

Run individual test after each fix to verify. If unfixable after 2 attempts: `test.skip(true, 'Descriptive reason')`.

### Phase 4: Validate and Report

1. Re-run the full target (file, directory, or tag). If new failures, repeat phases 2-3.
2. For single files: run 3 consecutive times to confirm stability.
3. Output summary:

```text
Debug Summary: <target>
  Total tests: N
  Passing: X
  Fixed: Y
  Skipped: Z

  Fixes applied:
    - <file>: <fix description>

  Tests skipped:
    - <file>: <reason>
```

## Troubleshooting

### Playwright MCP not connected

If MCP tools fail with "tool not found" or "connection refused": diagnose from error messages alone. Warn: "MCP not available — selector fixes may be inaccurate without live verification." Focus on fixes that don't require live inspection (missing awaits, type errors, obvious selector typos).

### No cluster reachable

If `npx playwright test` fails with login/connection errors on every test: this is an infrastructure issue, not a test bug. Report it to the user and suggest checking cluster access, `BRIDGE_BASE_ADDRESS`, and `storageState` files.

### Playwright not installed

If `npx playwright test` fails with "Cannot find module": the Playwright foundation hasn't been set up yet. Tell the user to complete the infrastructure setup first.

### Flaky test (passes sometimes, fails sometimes)

If a test passes on re-run without any fix: it's flaky. Use MCP to identify the timing-sensitive interaction, then fix with `robustClick()`, `waitForLoadingComplete()`, or a more specific `waitFor()` condition. Never mask flakiness with retries.

## Rules

- MCP first — always try browser tools before guessing at selectors
- Fix in the right layer
- Always use `--retries=0` during the cycle
- Run `cd frontend && yarn eslint <fixed-files>` after fixes
- **DO NOT commit** — the user handles git operations
