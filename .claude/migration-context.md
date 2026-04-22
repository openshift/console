# Cypress → Playwright Migration Context

Shared reference for migrating Console's Cypress e2e tests to Playwright. Used by `/migrate-cypress` and `/debug-test` skills. Adapted from [openshift-ui-tests-template cypress-migrator.mdc](https://github.com/bmaio-redhat/openshift-ui-tests-template/blob/main/.cursor/rules/cypress-migrator.mdc).

## High-Level Principles

1. **Understand, then rewrite.** Read the Cypress test to extract the _intent_ (what user workflow is being verified), then implement that intent using idiomatic Playwright patterns.
2. **Self-contained tests.** Each `test()` block must create its own resources, assert independently, and clean up after itself. Never rely on test execution order or shared mutable state across `it` blocks.
3. **Use the most specific API.** Prefer Playwright's built-in locator methods (`getByRole`, `getByTestId`, `getByText`, `getByLabel`) over generic `page.locator()` when they improve readability. Use `page.locator('[data-test="..."]')` for custom test attributes.
4. **Leverage the framework.** Use existing page objects, and clients. Create new ones only when needed — always search first.
5. **Live verification.** Use Playwright MCP browser tools to verify selectors, navigation flows, and element presence against the live UI before finalizing code.

## Console Custom Selector Commands

All 10 custom commands from `packages/integration-tests/support/selectors.ts`. Config: `testIdAttribute: 'data-test'` in `playwright.config.ts` — `page.getByTestId('x')` queries `[data-test="x"]`.

| Cypress Command                | CSS Selector                             | Playwright Equivalent                                          |
| :----------------------------- | :--------------------------------------- | :------------------------------------------------------------- |
| `cy.byTestID('x')`             | `[data-test="x"]`                        | `page.getByTestId('x')`                                        |
| `cy.byLegacyTestID('x')`       | `[data-test-id="x"]`                     | Change source to `data-test="x"`, then `page.getByTestId('x')` |
| `cy.byTestActionID('x')`       | `[data-test-action="x"]:not([disabled])` | `page.locator('[data-test-action="x"]:not([disabled])')`       |
| `cy.byButtonText('x')`         | `button` containing text                 | `page.getByRole('button', { name: 'x' })`                      |
| `cy.byDataID('x')`             | `[data-id="x"]`                          | `page.locator('[data-id="x"]')`                                |
| `cy.byTestSelector('x')`       | `[data-test-selector="x"]`               | `page.locator('[data-test-selector="x"]')`                     |
| `cy.byTestDropDownMenu('x')`   | `[data-test-dropdown-menu="x"]`          | `page.locator('[data-test-dropdown-menu="x"]')`                |
| `cy.byTestOperatorRow('x')`    | `[data-test-operator-row="x"]`           | `page.locator('[data-test-operator-row="x"]')`                 |
| `cy.byTestSectionHeading('x')` | `[data-test-section-heading="x"]`        | `page.locator('[data-test-section-heading="x"]')`              |
| `cy.byTestOperandLink('x')`    | `[data-test-operand-link="x"]`           | `page.locator('[data-test-operand-link="x"]')`                 |

---

## API Translation Reference

### Selectors

| Cypress                               | Playwright                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `cy.get('[data-test="x"]')`           | `page.getByTestId('x')` (page object: `this.page.getByTestId('x')`)                                       |
| `cy.get('[data-test-id="x"]')`        | `page.locator('[data-test-id="x"]')`                                                                      |
| `cy.byTestID('x')`                    | `page.getByTestId('x')`                                                                                   |
| `cy.byLegacyTestID('x')`              | `page.locator('[data-test-id="x"]')`                                                                      |
| `cy.byTestRows('resource-row')`       | `page.locator('[data-test-rows="resource-row"]')`                                                         |
| `cy.byButtonText('Save')`             | `page.getByRole('button', { name: 'Save' })`                                                              |
| `cy.contains('text')`                 | `page.getByText('text')` or `page.locator('selector', { hasText: 'text' })`                               |
| `cy.contains('selector', 'text')`     | `page.locator('selector', { hasText: 'text' })` or `page.locator('selector').filter({ hasText: 'text' })` |
| `cy.get('.pf-v6-c-table').find('tr')` | `page.locator('.pf-v6-c-table tr')` or compose with `.locator('tr')`                                      |
| `cy.get('body').then($body => if...)` | `const count = await locator.count();` then branch                                                        |

### Actions

| Cypress                            | Playwright                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cy.get(s).click()`                | `await this.robustClick(this.page.locator(s))` (page object)                                        |
| `cy.get(s).click({ force: true })` | `await this.robustClick(this.page.locator(s), { force: true })`                                     |
| `cy.get(s).type('text')`           | `await this.page.locator(s).fill('text')`                                                           |
| `cy.get(s).clear().type('text')`   | `await this.page.locator(s).fill('text')` (fill clears first)                                       |
| `cy.get(s).select('option')`       | `await this.page.locator(s).selectOption('option')`                                                 |
| `cy.get(s).check()`                | `await this.page.locator(s).check()`                                                                |
| `cy.get(s).uncheck()`              | `await this.page.locator(s).uncheck()`                                                              |
| `cy.get(s).scrollIntoView()`       | `await this.page.locator(s).scrollIntoViewIfNeeded()`                                               |
| `cy.get(s).within(() => { ... })`  | `const container = this.page.locator(s); container.locator(child)` — scope via chained `.locator()` |
| `cy.get('input').attachFile(f)`    | `await this.page.locator('input[type="file"]').setInputFiles(f)`                                    |
| `cy.dropFile(selector, file)`      | `await this.page.locator(selector).setInputFiles(filePath)`                                         |

### Navigation

| Cypress                                | Playwright                                                  |
| -------------------------------------- | ----------------------------------------------------------- |
| `cy.visit('/path')`                    | `await this.goTo('/path')` (page object `navigate*` method) |
| `cy.visitAndWait('/path')`             | `await this.goTo('/path')` (navigates + waits for loading)  |
| `cy.clickNavLink(['Storage', 'PVCs'])` | Page object sidebar navigation method                       |
| `cy.url().should('include', '/path')`  | `await expect(this.page).toHaveURL(/\/path/)`               |

### Assertions

| Cypress                                    | Playwright                                                         |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `cy.get(s).should('exist')`                | `await expect(this.page.locator(s)).toBeAttached()`                |
| `cy.get(s).should('not.exist')`            | `await expect(this.page.locator(s)).not.toBeAttached()`            |
| `cy.get(s).should('be.visible')`           | `await expect(this.page.locator(s)).toBeVisible()`                 |
| `cy.get(s).should('not.be.visible')`       | `await expect(this.page.locator(s)).not.toBeVisible()`             |
| `cy.get(s).should('contain', 'text')`      | `await expect(this.page.locator(s)).toContainText('text')`         |
| `cy.get(s).should('contain.text', 'text')` | `await expect(this.page.locator(s)).toContainText('text')`         |
| `cy.get(s).should('have.text', 'text')`    | `await expect(this.page.locator(s)).toHaveText('text')`            |
| `cy.get(s).should('have.value', 'v')`      | `await expect(this.page.locator(s)).toHaveValue('v')`              |
| `cy.get(s).should('be.disabled')`          | `await expect(this.page.locator(s)).toBeDisabled()`                |
| `cy.get(s).should('have.length', n)`       | `await expect(this.page.locator(s)).toHaveCount(n)`                |
| `.and('contain', 'x')`                     | chain: `await expect(loc).toContainText('x')` (separate assertion) |
| `cy.title().should('include', 't')`        | `await expect(this.page).toHaveTitle(/t/)`                         |

### Waits and Retries

| Cypress                                                  | Playwright                                                                                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cy.wait(3000)`                                          | **AVOID.** Use `await expect(locator).toBeVisible()` or condition-based waits. Only use `page.waitForTimeout()` as absolute last resort during debugging. |
| `cy.get(s, { timeout: 60000 })`                          | `await this.page.locator(s).waitFor({ state: 'visible', timeout: 60000 })`                                                                                |
| `cy.contains(text, { timeout })`                         | `await this.page.getByText(text).waitFor({ state: 'visible', timeout })`                                                                                  |
| `cy.intercept('GET', url).as('req')` + `cy.wait('@req')` | `await this.page.waitForResponse(url)` or `page.waitForResponse(resp => resp.url().includes(url))`                                                        |

### Resource Lifecycle

| Cypress                                      | Playwright                                                          |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `cy.exec('oc create ...')`                   | `KubernetesClient.createCustomResource(...)`                        |
| `cy.exec('oc delete ...')`                   | `KubernetesClient.deleteCustomResource(...)`                        |
| `cy.exec('oc get ... -o jsonpath')`          | `KubernetesClient.getCustomResource(...)`                           |
| `cy.exec('oc patch ...')`                    | `KubernetesClient.patchConfigMap(...)` or equivalent K8s API method |
| `cy.create(resourceJSON)`                    | `KubernetesClient.createCustomResource(...)`                        |
| `cy.deleteProject(name)`                     | `cleanup.trackNamespace(name)` — auto-deleted after test            |
| `cy.resourceShouldBeDeleted(ns, kind, name)` | `KubernetesClient.getCustomResource(...)` should throw 404          |

### Conditional Logic

| Cypress                                                               | Playwright                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `cy.get('body').then($body => { if ($body.find(s).length) { ... } })` | `if (await this.page.locator(s).count() > 0) { ... }`   |
| `cy.get(s).then($el => { ... })`                                      | `const text = await this.page.locator(s).textContent()` |
| Multiple `.then()` chains                                             | Sequential `await` statements                           |

---

## Structural Transformation Rules

### Rule 1: Flatten Sequential `it` Blocks into Self-Contained Tests

Cypress `testIsolation: false` means `it` blocks share browser state. In Playwright, each `test()` is isolated.

**Cypress pattern (anti-pattern for Playwright):**

```typescript
describe("Resource lifecycle", () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });
  it("create resource", () => {
    /* ... */
  });
  it("verify details", () => {
    /* assumes resource exists from prior it */
  });
  it("delete resource", () => {
    /* ... */
  });
  after(() => {
    cy.deleteProjectWithCLI(testName);
  });
});
```

**Playwright equivalent:**

```typescript
import { test, expect } from "../../fixtures";

test.describe("Resource lifecycle", { tag: ["@admin"] }, () => {
  test("verify resource details after creation", async ({ page, cleanup }) => {
    const ns = `test-${Date.now()}`;

    await test.step("Create resource", async () => {
      await KubernetesClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      // create resource via API or UI
    });

    await test.step("Verify details", async () => {
      const details = new DetailsPage(page);
      await details.navigateTo(`/k8s/ns/${ns}/deployments/my-app`);
      await expect(details.title).toContainText("my-app");
    });
    // cleanup runs automatically after test
  });
});
```

### Rule 2: Replace `before`/`after` Hooks with `test.step` Blocks and `cleanup`

Cypress hooks that create resources become explicit `test.step` blocks within each test. Resource cleanup is handled by the `cleanup` fixture — track resources with `cleanup.track*()` and they are deleted automatically after the test.

**Exception:** `test.beforeEach` for login is acceptable when ALL tests in a describe need the same login. Prefer the `storageState` mechanism from global setup.

### Rule 3: Replace Custom Commands with Page Object Methods

Every `cy.customCommand()` maps to a page object method. Tests call page objects directly.

| Cypress custom command                                     | Playwright equivalent                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cy.login()`                                               | `storageState` — zero code in tests                                       |
| `cy.initAdmin()`                                           | Admin project `storageState`                                              |
| `cy.visitAndWait(url)`                                     | `pageObject.goTo(url)`                                                    |
| `cy.clickNavLink([...])`                                   | `navPage.clickNavLink(...)`                                               |
| `cy.createProject(name)` / `cy.createProjectWithCLI(name)` | `KubernetesClient.createNamespace(name)` + `cleanup.trackNamespace(name)` |
| `cy.deleteProject(name)` / `cy.deleteProjectWithCLI(name)` | `cleanup` fixture handles it                                              |
| `cy.resourceShouldBeDeleted(ns, kind, name)`               | `await KubernetesClient.getCustomResource(...)` should throw              |
| `checkErrors()`                                            | Not needed — Playwright catches uncaught exceptions                       |

### Rule 4: Replace Fixed Waits with Condition-Based Waits

```typescript
// NEVER: cy.wait(5000) → page.waitForTimeout(5000)

// ALWAYS: condition-based assertion
await expect(statusLocator).toContainText("Running", { timeout: 120_000 });

// or: polling-based condition
await expect(async () => {
  const text = await statusLocator.textContent();
  expect(text).toContain("Running");
}).toPass({ timeout: 120_000 });
```

### Rule 5: Replace `cy.exec('oc ...')` with KubernetesClient

All cluster interactions go through `KubernetesClient` — never shell commands in tests.

```typescript
// NEVER
cy.exec("oc delete deployment test-app -n test-ns");

// ALWAYS
await KubernetesClient.deleteCustomResource(
  "apps",
  "v1",
  "test-ns",
  "deployments",
  "test-app",
);
```

### Rule 6: Replace `cy.get(...).within(...)` with Scoped Locators

```typescript
// Cypress
cy.get('[data-test="modal"]').within(() => {
  cy.get('[data-test="name"]').type('my-resource');
  cy.byButtonText('Submit').click();
});

// Playwright (page object method)
async fillModalForm(name: string): Promise<void> {
  const modal = this.page.getByTestId('modal');
  await modal.getByTestId('name').fill(name);
  await this.robustClick(modal.locator('button', { hasText: 'Submit' }));
}
```

### Rule 7: Handle Conditional Presence without `.then()`

```typescript
// Cypress
cy.get('body').then($body => {
  if ($body.find('[data-test="welcome"]').length > 0) {
    cy.get('[data-test="welcome"] button').click();
  }
});

// Playwright (page object)
async dismissWelcomeIfPresent(): Promise<void> {
  const welcome = this.page.getByTestId('welcome');
  if (await welcome.count() > 0) {
    await this.robustClick(welcome.locator('button'));
  }
}
```

### Rule 8: Map Cypress Retries to Playwright Retries

Cypress per-test `retries: { runMode: N }` becomes Playwright `test.describe.configure({ retries: N })` or is left to the global config. Never use per-test retries to mask flaky selectors — fix the root cause.

---

## Test Isolation Strategies

### Strategy A: Fully Self-Contained (preferred)

Each test creates its resources, runs assertions, and cleans up — even if the Cypress source had a shared `before` hook creating resources for multiple `it` blocks.

Use when: tests are short enough that resource creation doesn't dominate runtime.

### Strategy B: Shared Resources via `test.describe` Setup

When multiple tests need the same expensive resource (e.g., an installed operator):

```typescript
import { test, expect } from "../../fixtures";

test.describe("Operator tests", { tag: ["@admin"] }, () => {
  let namespace: string;

  test.beforeAll(async ({ browser }) => {
    namespace = `aut-operator-${Date.now()}`;
    const page = await browser.newPage();
    await KubernetesClient.createNamespace(namespace);
    // install operator or create expensive resource
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await KubernetesClient.deleteNamespace(namespace);
    await page.close();
  });

  test("verify operator installed", async ({ page }) => {
    /* ... */
  });
  test("create operand", async ({ page }) => {
    /* ... */
  });
});
```

Use when: multiple read-only tests share the same resource and creating it per-test would be too slow.

### Strategy C: API-Created Resources

Use `KubernetesClient` in `test.beforeAll` to create resources via API (faster than UI creation), then run UI-only assertions in tests.

---

## Page Object Pattern

- Extend `BasePage` (provides `robustClick()`, `waitForLoadingComplete()`, `goTo()`)
- Locators as `private readonly` properties
- Actions as `async` methods
- Use `robustClick()` for clicks intercepted by PatternFly overlays
- Locator priority: `getByTestId` > `getByRole` > `getByText` > `locator`

```typescript
// e2e/pages/cluster-settings.ts
import { BasePage } from "./base-page";

export class ClusterSettingsPage extends BasePage {
  private readonly detailsTab = this.page.locator(
    '[data-test-id="horizontal-link-Details"]',
  );
  private readonly upstreamServerUrl = this.page.locator(
    '[data-test-id="cv-upstream-server-url"]',
  );

  async navigateToDetails() {
    await this.goTo("/settings/cluster");
    await this.detailsTab.waitFor();
  }

  async clickUpstreamServerUrl() {
    await this.robustClick(this.upstreamServerUrl);
  }
}
```

---

## Gherkin Collapse

Gherkin's 4-file indirection collapses to 2 files:

| Gherkin source                             | Playwright target                                   |
| ------------------------------------------ | --------------------------------------------------- |
| `.feature` file                            | `test.describe` + `test()` blocks in `.spec.ts`     |
| Step definition file                       | Inline in test or page object method                |
| Page action file (`pages/*.ts`)            | Merged into page object class                       |
| Page object selectors (`pageObjects/*.ts`) | Merged into page object class as locator properties |

| Gherkin construct                 | Playwright equivalent                                           |
| --------------------------------- | --------------------------------------------------------------- |
| `Feature:`                        | `test.describe('...', () => { ... })`                           |
| `Scenario:`                       | `test('...', async ({ page }) => { ... })`                      |
| `Scenario Outline:` + `Examples:` | `for...of` loop or `[...].forEach()`                            |
| `Background:`                     | `test.beforeEach(async ({ page }) => { ... })`                  |
| `@smoke @regression`              | `test.describe('...', { tag: ['@smoke', '@regression'] }, ...)` |
| `@manual` / `@broken-test`        | `test.skip('reason')` or `test.fixme('reason')` with Jira link  |

---

## File Mapping Convention

| Cypress source                                                      | Playwright target                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/integration-tests/support/selectors.ts`                   | `BasePage` utilities and page object locators                      |
| `packages/integration-tests/support/login.ts`                       | Global setup `storageState` — no test-level code                   |
| `packages/integration-tests/support/nav.ts`                         | `navigate*` methods on page objects                                |
| `packages/integration-tests/support/project.ts`                     | `KubernetesClient` namespace methods + `cleanup` fixture           |
| `packages/integration-tests/views/list-page.ts`                     | `e2e/pages/list-page.ts` (page object class)                       |
| `packages/integration-tests/views/details-page.ts`                  | `e2e/pages/details-page.ts` (page object class)                    |
| `packages/integration-tests/views/modal.ts`                         | `e2e/pages/modal-page.ts` (page object class)                      |
| `packages/integration-tests/views/nav.ts`                           | `e2e/pages/nav-page.ts` (page object class)                        |
| `packages/integration-tests/views/<feature>.ts`                     | Methods within relevant page objects (e.g., `cluster-settings.ts`) |
| `packages/integration-tests/tests/<area>/<name>.cy.ts`              | `e2e/tests/<area>/<name>.spec.ts`                                  |
| `packages/<plugin>/integration-tests/features/<name>.feature`       | `e2e/tests/<area>/<name>.spec.ts`                                  |
| `packages/<plugin>/integration-tests/support/step-definitions/*.ts` | Inline in test or page object method                               |
| `packages/<plugin>/integration-tests/support/pages/*.ts`            | `e2e/pages/<name>.ts` (merged into page object)                    |
| `packages/<plugin>/integration-tests/support/pageObjects/*.ts`      | `e2e/pages/<name>.ts` (merged as locator properties)               |

---

## Migration Checklist

For each Cypress file being migrated:

- [ ] Read the entire Cypress test file and all imported views/constants/support
- [ ] Document each `it` block's intent in plain language
- [ ] Search existing page objects in `e2e/pages/` for reusable methods
- [ ] Identify test isolation strategy (A, B, or C)
- [ ] Create/extend page objects with needed locators and methods
- [ ] Write the spec file using project template
- [ ] Replace all `cy.wait()` with condition-based waits
- [ ] Replace all `cy.exec('oc ...')` with KubernetesClient calls
- [ ] Run `npx tsc --noEmit` — zero errors
- [ ] Run tests with `PLAYWRIGHT_RETRIES=0` — passing
- [ ] Verify no orphaned resources after test run

## Things to NEVER Do

- **Never import `test` or `expect` from `@playwright/test`** — import from `e2e/fixtures`
- **Never transliterate** — `cy.get(x).click()` → `page.locator(x).click()` is not a migration. Understand intent, use idiomatic Playwright APIs
- **Never use `page.waitForTimeout()`** as a replacement for `cy.wait()`. Find the condition to wait for
- **Never put locators in spec files** when a page object exists or should exist
- **Never rely on test order** — each `test()` must work independently.
- **Never skip cleanup** — every created resource must be tracked with `cleanup.track*()`
- **Never use shell commands** (`execSync`, `child_process`) when `KubernetesClient` has a method
