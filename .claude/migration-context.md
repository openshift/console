# Cypress → Playwright Migration Context

Shared reference for migrating Console's Cypress e2e tests to Playwright. Used by `/migrate-cypress` and `/debug-test` skills. Adapted from [openshift-ui-tests-template cypress-migrator.mdc](https://github.com/bmaio-redhat/openshift-ui-tests-template/blob/main/.cursor/rules/cypress-migrator.mdc).

## High-Level Principles

1. **Understand, then rewrite.** Read the Cypress test to extract the _intent_ (what user workflow is being verified), then implement that intent using idiomatic Playwright patterns.
2. **Self-contained tests.** Each `test()` block must create its own resources, assert independently, and clean up after itself. Never rely on test execution order or shared mutable state across `it` blocks.
3. **Use the most specific API.** Prefer Playwright's built-in locator methods (`getByRole`, `getByTestId`, `getByText`, `getByLabel`) over generic `page.locator()` when they improve readability. Use `page.locator('[data-test="..."]')` for custom test attributes.
4. **Leverage the framework.** Use existing page objects, and clients. Create new ones only when needed — always search first.
5. **Live verification.** Use Playwright MCP browser tools to verify selectors, navigation flows, and element presence against the live UI before finalizing code.

## Test Selectors

Config: `testIdAttribute: 'data-test'` in `frontend/playwright.config.ts` (from root of the project) so `page.getByTestId('x')` queries `[data-test="x"]`.

**Always use `page.getByTestId('x')`** for element selection. If a React element only has a legacy test attribute (`data-test-id`, `data-test-selector`, `data-test-action`, `data-test-dropdown-menu`, etc.) but no `data-test`, **add `data-test="<value>"` to the React component source** so `page.getByTestId()` can be used. Never remove legacy `data-test-*` attributes — external consumers may depend on them.

### How to add `data-test` during migration

When migrating a Cypress test that uses `cy.get('[data-test-id="x"]')` or `cy.byLegacyTestID('x')`:

1. Find the React component that renders the element with `data-test-id="x"`.
2. Add `data-test="x"` alongside the existing `data-test-id="x"`.
3. In the Playwright page object, use `this.page.getByTestId('x')` instead of `this.page.locator('[data-test-id="x"]')`.

```tsx
// Before (React component)
<div data-test-id="horizontal-link-Details">Details</div>

// After — data-test added, data-test-id preserved
<div data-test="horizontal-link-Details" data-test-id="horizontal-link-Details">Details</div>
```

---

## API Translation Reference

### Selectors

| Cypress                               | Playwright                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `cy.get('[data-test="x"]')`           | `page.getByTestId('x')` (page object: `this.page.getByTestId('x')`)                                       |
| `cy.get('[data-test-id="x"]')`        | Add `data-test="x"` to the React component, then use `page.getByTestId('x')`                              |
| `cy.byTestID('x')`                    | `page.getByTestId('x')`                                                                                   |
| `cy.byLegacyTestID('x')`              | Add `data-test="x"` to the React component, then use `page.getByTestId('x')`                              |
| `cy.byTestRows('resource-row')`       | Add `data-test="resource-row"` to the React component, then use `page.getByTestId('resource-row')`        |
| `cy.byButtonText('Save')`             | `page.getByRole('button', { name: 'Save' })`                                                              |
| `cy.contains('text')`                 | `page.getByText('text')` or `page.locator('selector', { hasText: 'text' })`                               |
| `cy.contains('selector', 'text')`     | `page.locator('selector', { hasText: 'text' })` or `page.locator('selector').filter({ hasText: 'text' })` |
| `cy.get('.pf-v6-c-table').find('tr')` | `page.locator('.pf-v6-c-table tr')` or compose with `.locator('tr')`                                      |
| `cy.get('body').then($body => if...)` | `const count = await locator.count();` then branch                                                        |

### Actions

| Cypress                            | Playwright                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cy.get(s).click()`                | In page objects: `await this.robustClick(locator)`. In specs: `await locator.click()`               |
| `cy.get(s).click({ force: true })` | Page object: `await this.robustClick(locator, { force: true })`. Spec: `locator.click({ force: true })` |
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
| `cy.get(s, { timeout }).click()`                         | `await locator.click({ timeout })` — pass timeout to the action, not a separate `waitFor()`. All Playwright actions accept a `timeout` option             |
| `cy.get(s, { timeout }).should('be.visible')`            | `await expect(locator).toBeVisible({ timeout })` — pass timeout to the assertion                                                                          |
| `cy.get(s, { timeout })` (no action, just waiting)       | `await locator.waitFor({ state: 'visible', timeout })` — only when no action or assertion follows                                                         |
| `cy.contains(text, { timeout })`                         | `await expect(page.getByText(text)).toBeVisible({ timeout })` or `await page.getByText(text).click({ timeout })` depending on what follows                |
| `cy.intercept('GET', url).as('req')` + `cy.wait('@req')` | `await this.page.waitForResponse(url)` or `page.waitForResponse(resp => resp.url().includes(url))`                                                        |

### Resource Lifecycle

| Cypress                                      | Playwright                                                          |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `cy.exec('oc create ...')`                   | `k8sClient.createCustomResource(...)` (via `k8sClient` fixture)     |
| `cy.exec('oc delete ...')`                   | `k8sClient.deleteCustomResource(...)`                               |
| `cy.exec('oc get ... -o jsonpath')`          | `k8sClient.getCustomResource(...)`                                  |
| `cy.exec('oc patch ...')`                    | `k8sClient.patchConfigMap(...)` or equivalent K8s API method        |
| `cy.create(resourceJSON)`                    | `k8sClient.createCustomResource(...)`                               |
| `cy.deleteProject(name)`                     | `cleanup.trackNamespace(name)` — registers for auto-deletion after test |
| `cy.resourceShouldBeDeleted(ns, kind, name)` | `k8sClient.getCustomResource(...)` should throw 404                 |

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
  test("verify resource details after creation", async ({ page, cleanup, k8sClient }) => {
    const ns = `test-${Date.now()}`;

    await test.step("Create resource", async () => {
      await k8sClient.createNamespace(ns);
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
| `cy.createProject(name)` / `cy.createProjectWithCLI(name)` | `k8sClient.createNamespace(name)` + `cleanup.trackNamespace(name)` |
| `cy.deleteProject(name)` / `cy.deleteProjectWithCLI(name)` | `cleanup.trackNamespace(name)` — registers for auto-deletion after test  |
| `cy.resourceShouldBeDeleted(ns, kind, name)`               | `await k8sClient.getCustomResource(...)` should throw                    |
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

### Rule 5: Replace `cy.exec('oc ...')` with `k8sClient` Fixture

All cluster interactions go through the `k8sClient` fixture (an instance of `KubernetesClient` injected per-worker) — never shell commands in tests.

```typescript
// NEVER
cy.exec("oc delete deployment test-app -n test-ns");

// ALWAYS — destructure k8sClient from the test fixtures
test('deletes resource', async ({ page, cleanup, k8sClient }) => {
  await k8sClient.deleteCustomResource(
    "apps",
    "v1",
    "test-ns",
    "deployments",
    "test-app",
  );
});
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

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `aut-operator-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    // install operator or create expensive resource
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
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

- Extend `BasePage` (provides `robustClick()`, `waitForLoadingComplete()`, `goTo()`, `navigateToTab()`, `clickButtonByText()`, `switchPerspective()`)
- Locators as `private readonly` properties. Use `getByTestId()` for `data-test` attributes, `locator()` for other selectors
- Expose locators to specs via getter methods (e.g., `getPageHeading(): Locator`) — specs should not access private locators directly
- Actions as `async` methods returning `Promise<void>`
- Use `robustClick()` inside page objects for clicks intercepted by PatternFly overlays; specs use plain `.click()`
- Locator priority: `getByTestId` > `getByRole` > `getByText` > `locator`

e.g.

```typescript
// e2e/pages/cluster-settings.ts
import type { Locator } from "@playwright/test";
import BasePage from "./base-page";

export class ClusterSettingsPage extends BasePage {
  private readonly detailsTab = this.page.getByTestId("horizontal-link-Details");
  private readonly pageHeading = this.page.getByTestId("cluster-settings-page-heading");
  private readonly upstreamServerUrl = this.page.getByTestId("cv-upstream-server-url");

  async navigateToDetails(): Promise<void> {
    await this.goTo("/settings/cluster");
    await this.detailsTab.waitFor({ state: "visible" });
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  async clickUpstreamServerUrl(): Promise<void> {
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
- [ ] Add `data-test` attributes to React components that only have legacy test attributes (`data-test-id`, etc.)
- [ ] Create/extend page objects with `getByTestId()` locators and methods
- [ ] Write the spec file using project template
- [ ] Replace all `cy.wait()` with condition-based waits
- [ ] Replace all `cy.exec('oc ...')` with KubernetesClient calls
- [ ] Run `npx tsc --noEmit` — zero errors
- [ ] Run tests with `PLAYWRIGHT_RETRIES=0` — passing
- [ ] Verify no orphaned resources after test run

## Playwright MCP and Self-Signed Certificates

OpenShift clusters use self-signed certificates. Both `browser_navigate` (Playwright MCP) and `navigate_page` (Chrome DevTools MCP) will fail with `ERR_CERT_AUTHORITY_INVALID`.

**Workaround:** Use `browser_run_code_unsafe` to create a new browser context with `ignoreHTTPSErrors: true`:

```javascript
async (page) => {
  const browser = page.context().browser();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  await p.goto('https://console-openshift-console.apps.<cluster>/');
  // ... interact with p for selector verification
}
```

The MCP's tracked page stays on `about:blank` — use the `p` reference from the new context for all interactions. Login via the OAuth form if needed (fill `#inputUsername`, `#inputPassword`, submit).

---

## Playwright Auto-Awaiting

Playwright action methods (`fill()`, `click()`, `check()`, `uncheck()`, `selectOption()`, `type()`, `press()`) **auto-wait for the element to be actionable** (visible, enabled, stable). You do NOT need an explicit `waitFor()` before calling these actions. This includes `robustClick()` in page objects — it also auto-waits.

> **ESLint enforcement:** The `no-restricted-syntax` rule in `e2e/.eslintrc.cjs` warns on all `.waitFor()` calls. Legitimate uses must have `// eslint-disable-next-line no-restricted-syntax`. This catches redundant `waitFor()` at lint time — `yarn eslint` will flag new violations.


```typescript
// WRONG — redundant waitFor before an action
await input.waitFor({ state: 'visible' });
await input.fill('text');

// WRONG — redundant waitFor before robustClick
await action.waitFor({ state: 'visible', timeout: 10_000 });
await this.robustClick(action);

// RIGHT — actions auto-wait for actionability
await input.fill('text');
await this.robustClick(action);

// RIGHT — if you need a custom timeout, pass it to the action
await input.fill('text', { timeout: 10_000 });
await action.click({ timeout: 10_000 });
```

Only use explicit `waitFor()` when you need to wait for an element **without acting on it** — e.g., confirming navigation completed, or waiting for loading indicators to disappear:

```typescript
// OK — waiting for a state transition, not an action
await page.getByTestId('loading-indicator').waitFor({ state: 'detached' });

// OK — confirming the editor loaded before reading its content (not an action on the element)
await page.getByTestId('code-editor').waitFor({ state: 'visible' });
```

Similarly, `waitForLoadingComplete()` should not be called at the end of page object methods like `selectProject()`. The caller's next action will auto-wait for whatever element it needs.

---

## Adding `data-test` Attributes

When migrating selectors, **always check the React source** for existing `data-test` attributes before creating locators:

1. **If `data-test` already exists** on the element → use `getByTestId('value')` directly.
2. **If only a legacy attribute exists** (`data-test-id`, `data-test-rows`, `data-test-dropdown-menu`, `data-test-action`, etc.) → add `data-test="value"` to the React component source alongside the existing legacy attribute, then use `getByTestId('value')`.
3. **Never use legacy attribute selectors** like `page.locator('[data-test-rows="..."]')` or `page.locator('[data-test-dropdown-menu="..."]')` when `data-test` exists or can be added.

```typescript
// WRONG — using legacy selector directly
private readonly resourceRows = this.page.locator('[data-test-rows="resource-row"]');

// RIGHT — data-test="resource-row" already exists on the same element
private readonly resourceRows = this.page.getByTestId('resource-row');
```

---

## k8sClient Cleanup

`KubernetesClient.deleteNamespace()` and `KubernetesClient.deleteCustomResource()` catch errors and call `isNotFound(err)` to silently swallow 404 "not found" responses. Do NOT wrap these cleanup calls in try/catch blocks. Note: `deleteClusterCustomResource` is not implemented in `KubernetesClient` — do not reference it.

```typescript
// WRONG — unnecessary error handling
test.afterAll(async ({ k8sClient }) => {
  try { await k8sClient.deleteNamespace(namespace); } catch { /* may already be deleted */ }
});

// RIGHT — k8sClient handles 404 silently
test.afterAll(async ({ k8sClient }) => {
  await k8sClient.deleteNamespace(namespace);
});
```

---

## Page Object Naming

- Do NOT prefix methods or locators with `legacy`. If a locator targets an older DOM structure that will be replaced, name it for what it does, not its age (e.g., `filterByNameInput` not `legacyFilterByName`).
- Common actions (navigate to form, click create dropdown item, filter + select) should be page object methods, not inline locator chains in spec files.

---

## Things to NEVER Do

- **Never import `test` or `expect` from `@playwright/test`** — import from `e2e/fixtures`
- **Never transliterate** — `cy.get(x).click()` → `page.locator(x).click()` is not a migration. Understand intent, use idiomatic Playwright APIs
- **Never use `page.waitForTimeout()`** as a replacement for `cy.wait()`. Find the condition to wait for
- **Never add `waitFor()` before an action** — `fill()`, `click()`, `check()`, etc. already auto-wait for actionability
- **Never use legacy test attribute selectors** (`[data-test-rows="..."]`, `[data-test-id="..."]`, `[data-test-dropdown-menu="..."]`) — add `data-test` to the React source and use `getByTestId()`
- **Never wrap k8sClient cleanup in try/catch** — `deleteNamespace` and `deleteCustomResource` already swallow 404s
- **Never prefix methods with `legacy`** — name for what it does, not its age
- **Never put locators in spec files** when a page object exists or should exist
- **Never rely on test order** — each `test()` must work independently.
- **Never skip cleanup** — every created resource must be tracked with `cleanup.track*()`
- **Never use shell commands** (`execSync`, `child_process`) when `KubernetesClient` has a method
