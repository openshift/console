---
name: gen-e2e-test
description: Generate Playwright e2e tests for OpenShift Console features. Creates spec files and page objects following the project's established patterns and conventions. Use this skill whenever the user wants to create, write, or add e2e tests, asks to cover a feature with e2e, describes a UI workflow to test, says "I need to test this feature", "add test coverage for X", or invokes /gen-e2e-test explicitly.
when_to_use: |
  TRIGGER on: "create e2e test", "write e2e test", "generate e2e", "add playwright test", "new e2e spec", "write a spec for", "add e2e coverage", "I need to test this feature", "cover this with e2e", "test this workflow", or explicit /gen-e2e-test invocations. Also trigger when user describes a UI workflow to test or asks to add test coverage for a feature.
  DO NOT trigger for: migrating Cypress tests (use migrate-cypress), fixing or debugging existing .spec.ts files (use debug-test), writing unit tests (use gen-rtl-test), running existing test suites.
model: opus
argument-hint: "<feature description> [--project=<name>] [--analyze]"
allowed-tools: Read, Write, Edit, Bash(find *), Bash(grep *), Bash(ls *), Bash(npx tsc *), Bash(npx playwright *), Bash(git diff *), Bash(git status), mcp__plugin_playwright_playwright__browser_navigate, mcp__plugin_playwright_playwright__browser_snapshot, mcp__plugin_playwright_playwright__browser_click, mcp__plugin_playwright_playwright__browser_console_messages, mcp__plugin_playwright_playwright__browser_take_screenshot, mcp__plugin_playwright_playwright__browser_resize, mcp__plugin_playwright_playwright__browser_run_code_unsafe, mcp__plugin_playwright_playwright__browser_evaluate, mcp__plugin_playwright_playwright__browser_close, mcp__plugin_playwright_playwright__browser_type, mcp__plugin_playwright_playwright__browser_wait_for, mcp__plugin_playwright_playwright__browser_network_requests, AskUserQuestion
---

# Generate Playwright E2E Test

Create idiomatic Playwright e2e tests for OpenShift Console features following the project's established patterns.

## Before Starting

1. Check that `frontend/e2e/.env` exists. If missing and `--analyze` is not specified, copy `frontend/e2e/.env.example` to `frontend/e2e/.env` and ask the user to fill in their cluster values. During `--analyze`, report the missing file without creating it.
2. Read `.claude/e2e-context.md` for project conventions, patterns, and rules. That file is the single source of truth for how Playwright tests should be structured.
3. Read `frontend/e2e/fixtures/index.ts` and trace its imports to discover all available fixtures.

## Input

- `/gen-e2e-test <description>`: generate test for the described feature/workflow
- `/gen-e2e-test <description> --project=<name>`: specify the Playwright project (default: inferred from feature area)
- `/gen-e2e-test <description> --analyze`: produce a test plan without generating code

### Examples

```shell
/gen-e2e-test "ConfigMap CRUD operations in admin perspective"
/gen-e2e-test "verify topology view shows deployments" --project=topology
/gen-e2e-test "developer user creates a project and deploys from git" --project=dev-console-developer
```

## Workflow

### Phase 1: Scope

1. Understand the feature/workflow to test from the user's description
2. Identify the Playwright project and output directory (see `e2e-context.md` Project Structure)
3. Identify admin vs developer persona
4. Determine test isolation strategy: self-contained (A), shared resources (B), or API-created (C)
5. Determine if tests can run in parallel or must be serial:
   - **Parallel**: tests are independent, each creates its own namespace, no shared mutable state
   - **Serial** (default): tests share a namespace, modify global settings, or depend on order
6. Document each test's intent in plain language
7. Produce a test plan:
   ```
   Test Plan: <feature>
     Project: <playwright-project>
     Output: e2e/tests/<project>/<name>.spec.ts
     Persona: admin | developer
     Isolation: Strategy A | B | C
     Execution: serial | parallel

     Tests:
     1. <test name>: <intent>
     2. <test name>: <intent>

     Page objects:
     - Reuse: <existing page objects>
     - Create: <new page objects needed>

     Resources:
     - <namespace, deployment, configmap, etc.>
   ```

**Stop here if `--analyze` was specified.** Ask the user to review and confirm before proceeding.

### Phase 2: Discover

1. Search existing page objects: `find frontend/e2e/pages -name "*.ts"`
2. Read relevant page objects to understand available methods and locators
3. Read `frontend/e2e/fixtures/index.ts` to understand available fixtures
4. Read `frontend/e2e/clients/kubernetes-client.ts` for available K8s API methods
5. If the feature involves React components, read the component source to find existing `data-test` attributes
6. If Playwright MCP is available:
   - Resize viewport to 1920x1080
   - Navigate to target pages in the live UI
   - Snapshot accessibility tree to discover selectors and `data-test` attributes
   - Verify selectors with non-submitting interactions (click navigation elements, type in search fields)
   - Do not submit forms, create resources, or perform state-changing actions during discovery. Ask the user before login or credential entry

   If MCP is unavailable or no cluster is reachable, log a warning: "Playwright MCP not available. Selectors based on React source only. Run `/debug-test` after deployment to verify." Proceed to Phase 3.

### Phase 3: Implement

1. **Add `data-test` attributes** to React components if needed. When a component only has legacy test attributes (`data-test-id`, etc.), add `data-test` alongside the legacy attribute (see `e2e-context.md` Test Selectors)

2. **Create/extend page objects** if needed:
   - Follow the BasePage pattern from `e2e-context.md`
   - `private readonly` locator properties using `getByTestId()` or `locator()`
   - Getter methods to expose locators (`getX(): Locator`)
   - Action methods returning `Promise<void>`
   - Use `robustClick()` for clicks inside page objects
   - Do NOT add `waitFor()` before action methods. Playwright auto-waits

3. **Write the spec file:**
   - `import { test, expect } from '../../fixtures'` (adjust relative path based on test depth)
   - Tags are optional. Only add them if they enable filtering beyond the directory structure (see `e2e-context.md` Tags section)
   - Apply the chosen isolation strategy and execution mode
   - Use `test.step()` for multi-phase workflows within a single test
   - Track all created resources with `cleanup.track*()` or use `test.afterAll` for shared resources
   - Name tests by user intent, not implementation

4. **Validate code** (run from `frontend/`):
   - `cd frontend && npx tsc --noEmit -p e2e/tsconfig.json`: zero type errors
   - `cd frontend && yarn eslint <generated-files>`: fix lint errors

### Phase 4: Verify

1. Run (from `frontend/`): `cd frontend && npx playwright test --project=<project> <spec-file> --retries=0`
   - For developer tests: `--project=<project>-developer`
   - Note: `e2e/.env` may set `WEB_CONSOLE_URL` to a remote cluster. If running against localhost, verify `.env` or override with `WEB_CONSOLE_URL=http://localhost:9000`
2. Debug failures using Playwright MCP if available (navigate → snapshot → console → network). Fix and re-run.
3. If a test still fails after 3 fix attempts, stop trying and ask the user if they want to run `/debug-test <spec-file>` for deeper MCP-assisted diagnosis.
4. Run 2 additional times to confirm stability
5. Verify no orphaned resources after test run
6. Output summary:
   ```
   Generation complete: e2e/tests/<project>/<name>.spec.ts
     Tests created: N
     Page objects created: [list]
     Page objects reused: [list]
     Files written: [list]
     Validation: passed
   ```

## Rules

- Always read `e2e-context.md` before writing any code
- Discover available fixtures and page objects before creating new ones
- Use Playwright MCP to verify selectors when available
- Follow the project's existing patterns. Don't invent new conventions
- Golden path first. Only add edge case tests when explicitly asked
- **DO NOT commit.** The user handles git operations
