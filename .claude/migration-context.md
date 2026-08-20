# Cypress → Playwright Migration Context

Migration-specific reference for translating Cypress and Gherkin tests to Playwright. For universal Playwright patterns (page objects, selectors, fixtures, cleanup, waits), see `e2e-context.md`.

## Migration Principles

1. **Understand, then rewrite.** Read the Cypress test to extract the _intent_ (what user workflow is being verified), then implement that intent using idiomatic Playwright patterns. Never transliterate line-by-line. `cy.get(x).click()` → `page.locator(x).click()` is not a migration.
2. **Know how Cypress works.** Cypress tests run in the browser with automatic retry and implicit waits. `testIsolation: false` means sequential `it` blocks share browser state: the page, cookies, and DOM persist between blocks. Playwright isolates each `test()` by default, so sequential `it` blocks that depend on shared state must be merged into a single `test()` with `test.step()` blocks.
3. **Cypress hooks create shared mutable state.** `before()` runs once and sets up state (resources, navigation) that all `it` blocks inherit. `beforeEach()` runs before every block. In Playwright, this shared state doesn't carry over between `test()` blocks, so hook logic must move into each test or into `test.beforeAll`/`test.beforeEach` with explicit fixture usage.
4. **Cypress custom commands are global.** Commands like `cy.login()`, `cy.createProject()`, `cy.visitAndWait()` are registered globally via `Cypress.Commands.add()`. In Playwright, these become page object methods, fixture utilities, or setup functions. There is no global command registry.

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
| `cy.get(s).within(() => { ... })`  | `const container = this.page.locator(s); container.locator(child)`. Scope via chained `.locator()` |
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
| `cy.wait(3000)`                                          | **AVOID.** Use `await expect(locator).toBeVisible()` or condition-based waits. See `e2e-context.md` Auto-Awaiting section.                                |
| `cy.get(s, { timeout }).click()`                         | `await locator.click({ timeout })`. Pass timeout to the action                                                                                          |
| `cy.get(s, { timeout }).should('be.visible')`            | `await expect(locator).toBeVisible({ timeout })`. Pass timeout to the assertion                                                                          |
| `cy.get(s, { timeout })` (no action, just waiting)       | `await expect(locator).toBeVisible({ timeout })`. Prefer assertion over `waitFor()` to avoid the `no-restricted-syntax` ESLint rule. Use `locator.waitFor()` with `// eslint-disable-next-line no-restricted-syntax` only for non-visible states like `'detached'` or `'hidden'` |
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
| `cy.deleteProject(name)`                     | `await k8sClient.deleteNamespace(name)`. For explicit deletion. Track namespaces at creation time with `cleanup.trackNamespace(name)` |
| `cy.resourceShouldBeDeleted(ns, kind, name)` | `k8sClient.getCustomResource(...)` should throw 404                 |

### Conditional Logic

| Cypress                                                               | Playwright                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `cy.get('body').then($body => { if ($body.find(s).length) { ... } })` | `if (await this.page.locator(s).count() > 0) { ... }`   |
| `cy.get(s).then($el => { ... })`                                      | `const text = await this.page.locator(s).textContent()` |
| Multiple `.then()` chains                                             | Sequential `await` statements                           |

### Custom Commands

| Cypress custom command                                     | Playwright equivalent                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cy.login()`                                               | `storageState`. Zero code in tests                                       |
| `cy.initAdmin()`                                           | Admin project `storageState`                                              |
| `cy.visitAndWait(url)`                                     | `pageObject.goTo(url)`                                                    |
| `cy.clickNavLink([...])`                                   | `navPage.clickNavLink(...)`                                               |
| `cy.createProject(name)` / `cy.createProjectWithCLI(name)` | `k8sClient.createNamespace(name)` + `cleanup.trackNamespace(name)`       |
| `cy.deleteProject(name)` / `cy.deleteProjectWithCLI(name)` | `await k8sClient.deleteNamespace(name)`. Track at creation with `cleanup.trackNamespace(name)` |
| `cy.resourceShouldBeDeleted(ns, kind, name)`               | `await k8sClient.getCustomResource(...)` should throw                    |
| `checkErrors()`                                            | Not needed. Playwright catches uncaught exceptions                       |

---

## Structural Transformation Rules

### Rule 1: Flatten Sequential `it` Blocks

Cypress `testIsolation: false` means `it` blocks share browser state. In Playwright, each `test()` is isolated.

**Cypress pattern (recognize and transform):**

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

**Playwright equivalent** . merge into one `test()` with `test.step()`, use `cleanup` fixture:

```typescript
import { test, expect } from "../../fixtures";

test.describe("Resource lifecycle", { tag: ["@admin"] }, () => {
  test("verify resource details after creation", async ({ page, cleanup, k8sClient }) => {
    const ns = `test-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    await test.step("Create resource", async () => {
      // create resource via API or UI
    });

    await test.step("Verify details", async () => {
      const details = new DetailsPage(page);
      await details.navigateTo(`/k8s/ns/${ns}/deployments/my-app`);
      await expect(details.getTitle()).toContainText("my-app");
    });
    // cleanup runs automatically after test
  });
});
```

### Rule 2: Replace `before`/`after` Hooks

Dependent sequential `it` blocks that share state become one `test()` with `test.step()` blocks. Per-test resource cleanup uses `cleanup.track*()`. When using Strategy B (shared expensive resources), `test.beforeAll`/`test.afterAll` are acceptable for namespace creation and teardown.

**Exception:** `test.beforeEach` for login is acceptable when ALL tests in a describe need the same login. However, prefer the `storageState` mechanism from global setup. `cy.login()` maps to zero test-level code via stored auth state (see Custom Commands table).

### Rule 3: Replace Custom Commands with Page Object Methods

Every `cy.customCommand()` maps to a page object method. See the Custom Commands table above.

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

See `e2e-context.md` Auto-Awaiting section for full details.

### Rule 5: Replace `cy.exec('oc ...')` with `k8sClient`

All cluster interactions go through the `k8sClient` fixture. Never shell commands in tests.

```typescript
// NEVER
cy.exec("oc delete deployment test-app -n test-ns");

// ALWAYS: destructure k8sClient from the test fixtures
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

Cypress per-test `retries: { runMode: N }` becomes Playwright `test.describe.configure({ retries: N })` or is left to the global config. Never use per-test retries to mask flaky selectors. Fix the root cause.

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
| `packages/integration-tests/support/login.ts`                       | Global setup `storageState`. No test-level code                   |
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
- [ ] Identify test isolation strategy (A, B, or C, see `e2e-context.md`)
- [ ] Add `data-test` attributes to React components that only have legacy test attributes
- [ ] Create/extend page objects with `getByTestId()` locators and methods
- [ ] Write the spec file using project template
- [ ] Replace all `cy.wait()` with condition-based waits
- [ ] Replace all `cy.exec('oc ...')` with KubernetesClient calls
- [ ] Run `cd frontend && npx tsc --noEmit -p e2e/tsconfig.json`. Zero errors
- [ ] Run tests with `--retries=0`. Passing
- [ ] Verify no orphaned resources after test run
