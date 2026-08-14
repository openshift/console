---
name: migrate-cypress
description: Migrate a Cypress test file (.cy.ts) or Gherkin feature file (.feature) to Playwright following Console's architecture. This is the ONLY skill for Cypress-to-Playwright conversion work, supporting full migration, analysis-only (--analyze), or dry-run (--dry-run) modes. Use this skill whenever the user wants to convert, port, rewrite, or migrate Cypress or Gherkin tests to Playwright, mentions "old cypress tests", "remaining e2e tests", or provides a .cy.ts or .feature file path in a migration context.
when_to_use: |
  TRIGGER on: "migrate cypress", "migrate e2e", "migrate test", "convert cypress", "port to playwright", "rewrite in playwright", "convert these old tests", file paths ending in .cy.ts or .feature in a migration context, requests to rewrite Gherkin scenarios as Playwright specs, or explicit /migrate-cypress invocations. Also trigger when user mentions converting "old cypress tests", "remaining e2e tests", or moving test suites from Cypress to Playwright.
  DO NOT trigger for: writing new Playwright tests from scratch (no Cypress source), fixing or debugging existing .spec.ts files (use debug-test instead), running test suites, editing test infrastructure (base-page.ts, fixtures, KubernetesClient), or questions about Playwright API without migration intent.
model: opus
argument-hint: "<path/to/file.cy.ts or .feature> [--analyze] [--dry-run]"
allowed-tools: Read, Write, Edit, Bash(find *), Bash(grep *), Bash(ls *), Bash(npx tsc *), Bash(npx playwright *), Bash(git diff *), Bash(git status), mcp__plugin_playwright_playwright__browser_navigate, mcp__plugin_playwright_playwright__browser_snapshot, mcp__plugin_playwright_playwright__browser_click, mcp__plugin_playwright_playwright__browser_console_messages, mcp__plugin_playwright_playwright__browser_take_screenshot, mcp__plugin_playwright_playwright__browser_resize, mcp__plugin_playwright_playwright__browser_run_code_unsafe, mcp__plugin_playwright_playwright__browser_evaluate, mcp__plugin_playwright_playwright__browser_close, mcp__plugin_playwright_playwright__browser_type, mcp__plugin_playwright_playwright__browser_wait_for, mcp__plugin_playwright_playwright__browser_network_requests, AskUserQuestion
---

# Migrate: Cypress to Playwright

Translate Cypress E2E tests into idiomatic Playwright code following Console's layered architecture. Adapted from [openshift-ui-tests-template/migrate.md](https://github.com/bmaio-redhat/openshift-ui-tests-template/blob/main/.cursor/commands/migrate.md).

## Before Starting

1. Check that `frontend/e2e/.env` exists. If missing, copy `frontend/e2e/.env.example` to `frontend/e2e/.env` and tell the user to fill in their cluster values before continuing.
2. Read `.claude/e2e-context.md` for project conventions, patterns, and rules, page objects, selectors, fixtures, cleanup, waits, and things to never do. That file is the single source of truth for how Playwright tests should be structured.
3. Read `.claude/migration-context.md` for the Cypress → Playwright API translation tables, structural transformation rules, Gherkin collapse mappings, and migration checklist.

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

### Output File Mapping

Migrated tests go under `e2e/tests/<package>/` based on their source package:

| Source package                                           | Playwright project | Output directory            |
| -------------------------------------------------------- | ------------------ | --------------------------- |
| `packages/integration-tests/tests/<area>/`               | `console`          | `e2e/tests/console/<area>/` |
| `packages/dev-console/integration-tests/`                | `dev-console`      | `e2e/tests/dev-console/`    |
| `packages/helm-plugin/integration-tests/`                | `helm`             | `e2e/tests/helm/`           |
| `packages/knative-plugin/integration-tests/`             | `knative`          | `e2e/tests/knative/`        |
| `packages/operator-lifecycle-manager/integration-tests/` | `olm`              | `e2e/tests/olm/`            |
| `packages/topology/integration-tests/`                   | `topology`         | `e2e/tests/topology/`       |
| `packages/webterminal-plugin/integration-tests/`         | `webterminal`      | `e2e/tests/webterminal/`    |
| `packages/console-telemetry-plugin/integration-tests/`   | `telemetry`        | `e2e/tests/telemetry/`      |

Tests requiring developer auth go in a `developer/` subdirectory (e.g. `e2e/tests/dev-console/developer/`).

## Workflow

### Phase 1: Analysis

1. Read the Cypress file and all imported views, constants, types, and custom commands. For `.feature` files, also resolve step definitions (`support/step-definitions/`), page actions (`support/pages/`), and page object selectors (`support/pageObjects/`).
2. Extract intent — document what each `it` block or `Scenario` tests in plain language
3. Search existing page objects and clients for reusable methods (from project root): `find frontend/e2e/pages frontend/e2e/clients -name "*.ts" 2>/dev/null`
4. Identify gaps — missing locators, page object methods
5. Determine test isolation strategy (self-contained, shared resources, or API-created — see migration-context.md for details)
6. Produce a migration plan mapping Cypress blocks to Playwright components

Expected output: a structured plan listing each test's intent, the Playwright components to use/create, the isolation strategy, and the output file path.

**Stop here if `--analyze` was specified.**

### Phase 2: Selector Discovery (Playwright MCP)

1. Resize viewport to 1920×1080
2. Navigate to target pages in the live UI
3. Snapshot accessibility tree to discover `data-test` attributes and element roles
4. Verify selectors with non-submitting interactions (click navigation elements, type in search fields). Do not submit forms or perform create/update/delete actions during discovery. Ask the user before login or credential entry
5. Update migration plan with verified selectors

If MCP is unavailable or no cluster is reachable, log a warning: "Playwright MCP not available — selectors translated literally. They may be stale. Run `/debug-test` after deployment to verify." Proceed to Phase 3.

### Phase 3: Implementation

1. Create/extend page objects with locators and interaction methods. Follow the established pattern:
   - Import `Locator` type from `@playwright/test` and default-import `BasePage`
   - Use `getByTestId()` for `data-test` attributes, `locator()` for other selectors
   - If the React component only has a legacy test attribute (`data-test-id`, `data-test-rows`, `data-test-dropdown-menu`, etc.) but no `data-test`, **add `data-test` to the React component source** and use `getByTestId()` — never use legacy attribute selectors directly
   - Expose locators via getter methods (`getX(): Locator`), keep locator properties `private readonly`
   - Use `robustClick()` inside page objects; specs use plain `.click()`
   - Do NOT add `waitFor()` before action methods (`fill()`, `click()`, `check()`) — Playwright auto-waits for actionability
   - Do NOT name methods or locators with a `legacy` prefix — name for what they do

Example:
   ```typescript
   // e2e/pages/cluster-settings.ts
   import type { Locator } from "@playwright/test";
   import BasePage from "./base-page";

   export class ClusterSettingsPage extends BasePage {
     private readonly detailsTab = this.page.getByTestId("horizontal-link-Details");
     private readonly pageHeading = this.page.getByTestId("cluster-settings-page-heading");

     async navigateToDetails(): Promise<void> {
       await this.goTo("/settings/cluster");
       await this.detailsTab.waitFor({ state: "visible" });
     }

     getPageHeading(): Locator {
       return this.pageHeading;
     }
   }
   ```
2. Write the spec file following project template:
   - `import { test, expect } from '../../fixtures'`
   - Tags are optional. Only add them if they enable filtering beyond the directory structure (see `e2e-context.md` Tags section)
   - Admin tests go in `e2e/tests/<package>/`, developer tests in `e2e/tests/<package>/developer/`
   - Self-contained: create → assert → cleanup in each `test()`
   - Use `test.step()` for logical grouping when a test has 3+ distinct phases
   - For Gherkin `Scenario Outline` + `Examples`: use `for...of` loop
   - For `@manual` / `@broken-test`: use `test.skip(true, 'reason')` or `test.fixme('reason')` with Jira link
3. Run `npx tsc --noEmit -p e2e/tsconfig.json` and `cd frontend && yarn eslint <generated-files>` — fix any type or lint errors

**Print code without writing if `--dry-run` was specified.**

### Phase 4: Validation

1. Run with `npx playwright test --project=<package> <output-file> --retries=0`. The project name matches the package directory under `e2e/tests/` (e.g. `--project=helm`, `--project=console`). For developer tests, use `--project=<package>-developer`. Add `--ui` only if the user requests interactive debugging. Note: `e2e/.env` may override `WEB_CONSOLE_URL` with a remote cluster URL. If running against localhost, ensure the user has updated `e2e/.env` or override with `WEB_CONSOLE_URL=http://localhost:9000`.
2. If the first run passes, run 2 additional times with `--retries=0` to catch intermittent failures. A migrated test that passes once but fails on subsequent runs is flaky and must be fixed before the migration is complete.
3. Debug failures using Playwright MCP (navigate → snapshot → console → network). Fix and re-run.
4. If a test still fails after 3 fix attempts, stop trying and ask the user if they want to run `/debug-test <spec-file>` for deeper MCP-assisted diagnosis.
5. Verify no orphaned resources after run
6. Produce migration summary:
   ```
   Migration complete: <source-file> → <output-file>
     Tests migrated: N
     Page objects created: [list]
     Page objects reused: [list]
     Files written: [list]
     Validation: passed

     Test mapping:
     | Cypress test                          | Playwright test                       | Assertions |
     |---------------------------------------|---------------------------------------|------------|
     | it('does something')                  | test('does something')                | 3 → 3      |
     | it('handles edge case')               | test('handles edge case')             | 2 → 2      |
     | ...                                   | ...                                   | ...        |
     | Total                                 |                                       | 8 → 8      |
   ```
   The "Assertions" column shows `<cypress count> → <playwright count>`. If a Playwright test has fewer assertions than its Cypress counterpart, flag it with `⚠` and investigate — assertions may have been silently dropped.
5. If validation passes, delete the original Cypress test file. Also check imported view and support files — if they are no longer imported by any other Cypress test, delete them too.

## Flakiness Prevention

Migration is the biggest source of flaky tests. Cypress and Playwright have fundamentally different execution models, and patterns that are stable in Cypress can be intermittent in Playwright. Watch for these during migration:

- **Cypress retries assertions implicitly.** `cy.get(s).should('be.visible')` retries for up to 4 seconds by default. Playwright's `expect(locator).toBeVisible()` also retries, but with a different timeout (5s default). If the Cypress test relied on a long implicit wait, pass an explicit timeout: `await expect(locator).toBeVisible({ timeout: 30_000 })`.
- **Cypress `cy.wait()` masks timing issues.** A `cy.wait(3000)` in Cypress often hides a race condition. Don't replace it with `page.waitForTimeout(3000)`. Instead, find what the wait is actually waiting for (a network response, a DOM element, a state change) and wait for that condition explicitly.
- **Cypress shared state hides flakes.** With `testIsolation: false`, sequential `it` blocks share cookies, DOM, and navigation state. A test that passes in Cypress because the previous `it` left the page in the right state will fail intermittently in Playwright if the navigation or setup is incomplete. When merging `it` blocks into `test.step()`, make each step's preconditions explicit.
- **PatternFly overlays intercept clicks.** Cypress `click({ force: true })` bypasses overlay checks. In Playwright, use `robustClick()` in page objects. This retries with scroll-into-view and falls back to force-click, which is more reliable than a single forced click.
- **Resource creation races.** Cypress `cy.exec('oc create ...')` is synchronous within the test. `k8sClient.createNamespace()` is async. If the test navigates to a resource page immediately after creation, add an explicit wait for the resource to be ready: `await k8sClient.waitForNamespaceReady(ns)`.

## Key Translation Rules

- **Never transliterate** — understand intent, use idiomatic Playwright APIs
- **Self-contained tests** — merge sequential `it` blocks into one `test()` with `test.step()`
- **No fixed waits** — replace `cy.wait(ms)` with condition-based waits or assertion timeouts
- **No redundant `waitFor()`** — `fill()`, `click()`, `check()`, etc. auto-wait for actionability; only use `waitFor()` when waiting for state without acting on the element
- **No shell commands** — replace `cy.exec('oc ...')` with `KubernetesClient`
- **No try/catch in cleanup** — `k8sClient.deleteNamespace()`, `deleteCustomResource()`, and `deleteClusterCustomResource()` already swallow 404 errors
- **Add `data-test` to React source** — when the component only has legacy test attributes (`data-test-id`, `data-test-rows`, etc.), add `data-test` alongside and use `getByTestId()`
- **Framework-first** — use existing page objects before creating new ones
- **Correct layer** — locators in page objects, test scenarios in specs; common multi-step interactions belong in page object methods, not inline in specs

## Troubleshooting

### Playwright MCP not connected

If MCP tools fail with "tool not found" or "connection refused": skip Phase 2, translate selectors literally, and warn the user. Selectors can be verified later with `/debug-test`.

### TypeScript errors in generated files

If `npx tsc --noEmit` reports errors in the generated spec or page object: read the errors, fix missing imports or type mismatches, and re-run. Common causes: missing page object import, wrong fixture type, incorrect `KubernetesClient` method signature.

### Test passes but assertions are missing

Compare assertion count with the original Cypress test. If the migrated test has fewer assertions, the agent may have silently dropped failing ones. Restore them using the intent documented in Phase 1.

## Rules

- Always read the Cypress source before writing any code
- Use Playwright MCP to verify selectors against the live UI
- Follow `.claude/e2e-context.md` for Playwright patterns and `.claude/migration-context.md` for Cypress translation tables
- **DO NOT commit** — the user handles git operations
