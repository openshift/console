---
name: migrate-cypress
description: Migrate a Cypress test file to Playwright following Console's architecture. Use when user says "migrate", "convert cypress", "port to playwright", or provides a .cy.ts or .feature file path.
argument-hint: "<path/to/file.cy.ts or .feature> [--analyze] [--dry-run]"
allowed-tools: Read, Write, Edit, Bash(find *), Bash(grep *), Bash(ls *), Bash(npx tsc *), Bash(npx playwright *), Bash(git diff *), Bash(git status), mcp__plugin_playwright_playwright__browser_navigate, mcp__plugin_playwright_playwright__browser_snapshot, mcp__plugin_playwright_playwright__browser_click, mcp__plugin_playwright_playwright__browser_console_messages, mcp__plugin_playwright_playwright__browser_take_screenshot, mcp__plugin_playwright_playwright__browser_resize, AskUserQuestion
---

# Migrate: Cypress to Playwright

Translate Cypress E2E tests into idiomatic Playwright code following Console's layered architecture. Adapted from [openshift-ui-tests-template/migrate.md](https://github.com/bmaio-redhat/openshift-ui-tests-template/blob/main/.cursor/commands/migrate.md).

## Before Starting

Read `.claude/migration-context.md` for the complete API translation tables, structural transformation rules, Console selector mappings, and migration checklist. That file is the single source of truth for all translation context.

## Input

- `/migrate-cypress <cypress-file-or-feature>` — full migration (analyze → implement → validate)
- `/migrate-cypress <cypress-file-or-feature> --analyze` — analysis only, produce migration plan
- `/migrate-cypress <cypress-file-or-feature> --dry-run` — generate code without writing files

### Examples

```
/migrate-cypress frontend/packages/integration-tests/tests/cluster-settings/upstream-modal.cy.ts
/migrate-cypress upstream-modal --analyze
/migrate-cypress frontend/packages/dev-console/integration-tests/features/addFlow/ --dry-run
```

## Workflow

### Phase 1: Analysis

1. Read the Cypress file and all imported views, constants, types, and custom commands. For `.feature` files, also resolve step definitions (`support/step-definitions/`), page actions (`support/pages/`), and page object selectors (`support/pageObjects/`).
2. Extract intent — document what each `it` block or `Scenario` tests in plain language
3. Search existing page objects and clients for reusable methods: `find frontend/e2e/pages -name "*.ts" 2>/dev/null`
4. Identify gaps — missing locators, page object methods
5. Determine test isolation strategy (self-contained, shared resources, or API-created — see migration-context.md for details)
6. Produce a migration plan mapping Cypress blocks to Playwright components

Expected output: a structured plan listing each test's intent, the Playwright components to use/create, the isolation strategy, and the output file path.

**Stop here if `--analyze` was specified.**

### Phase 2: Selector Discovery (Playwright MCP)

1. Resize viewport to 1920×1080
2. Navigate to target pages in the live UI
3. Snapshot accessibility tree to discover `data-test` attributes and element roles
4. Verify interactive elements work (click, type)
5. Update migration plan with verified selectors

If MCP is unavailable or no cluster is reachable, log a warning: "Playwright MCP not available — selectors translated literally. They may be stale. Run `/debug-test` after deployment to verify." Proceed to Phase 3.

### Phase 3: Implementation

1. Create/extend page objects with locators and interaction methods. Example:
   ```typescript
   // e2e/pages/cluster-settings.ts
   export class ClusterSettingsPage extends BasePage {
     private readonly detailsTab = this.page.locator(
       '[data-test-id="horizontal-link-Details"]',
     );
     async navigateToDetails() {
       await this.goTo("/settings/cluster");
       await this.detailsTab.waitFor();
     }
   }
   ```
2. Write the spec file following project template:
   - `import { test, expect } from '../../fixtures'`
   - `test.describe` with tags (`{ tag: ['@admin'] }` or `{ tag: ['@developer'] }`)
   - Self-contained: create → assert → cleanup in each `test()`
   - Use `test.step()` for logical grouping when a test has 3+ distinct phases
   - For Gherkin `Scenario Outline` + `Examples`: use `for...of` loop
   - For `@manual` / `@broken-test`: use `test.skip(true, 'reason')` or `test.fixme('reason')` with Jira link
3. Run `npx tsc --noEmit -p e2e/tsconfig.json` and `cd frontend && yarn eslint <generated-files>` — fix any type or lint errors

**Print code without writing if `--dry-run` was specified.**

### Phase 4: Validation

1. Run with `npx playwright test <output-file> --retries=0`. Note: `e2e/.env` may override `WEB_CONSOLE_URL` with a remote cluster URL. If running against localhost, ensure the user has updated `e2e/.env` or override with `WEB_CONSOLE_URL=http://localhost:9000`.
2. Debug failures using Playwright MCP (navigate → snapshot → console → network)
3. Verify no orphaned resources after run
4. Produce migration summary:
   ```
   Migration complete: <source-file> → <output-file>
     Tests migrated: N
     Page objects created: [list]
     Page objects reused: [list]
     Files written: [list]
     Validation: passed
   ```
5. If validation passes, delete the original Cypress test file. Also check imported view and support files — if they are no longer imported by any other Cypress test, delete them too.

## Key Translation Rules

- **Never transliterate** — understand intent, use idiomatic Playwright APIs
- **Self-contained tests** — merge sequential `it` blocks into one `test()` with `test.step()`
- **No fixed waits** — replace `cy.wait(ms)` with condition-based waits or assertion timeouts
- **No shell commands** — replace `cy.exec('oc ...')` with `KubernetesClient`
- **Framework-first** — use existing page objects before creating new ones
- **Correct layer** — locators in page objects, test scenarios in specs

## Troubleshooting

### Playwright MCP not connected

If MCP tools fail with "tool not found" or "connection refused": skip Phase 2, translate selectors literally, and warn the user. Selectors can be verified later with `/debug-test`.

### TypeScript errors in generated files

If `npx tsc --noEmit` reports errors in the generated spec or page object: read the errors, fix missing imports or type mismatches, and re-run. Common causes: missing page object import, wrong fixture type, incorrect `KubernetesClient` method signature.

### Test passes but assertions are missing

Compare assertion count with the original Cypress test. If the migrated test has fewer assertions, the agent may have silently dropped failing ones. Restore them using the intent documented in Phase 1.

## Selector Attribute Unification

During migration, **unify `data-test-id` → `data-test`** in the source components touched by the test:

1. Find the source `.tsx` file that renders each `data-test-id` selector used by the Cypress test.
2. Change the attribute from `data-test-id="x"` to `data-test="x"` in the source component.
3. Verify the change on the live UI via Playwright MCP (click/snapshot to confirm the selector resolves).
4. Use `page.getByTestId('x')` in the Playwright test — never `page.locator('[data-test-id="x"]')`.
5. List all source files modified for selector unification in the migration summary under "Selectors unified".

## Rules

- Always read the Cypress source before writing any code
- Use Playwright MCP to verify selectors against the live UI
- Follow `.claude/migration-context.md` for API translation tables
- **DO NOT commit** — the user handles git operations
