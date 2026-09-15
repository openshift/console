# Playwright E2E Test Context

Shared reference for writing, migrating, and debugging Playwright e2e tests in OpenShift Console. Used by `/gen-e2e-test`, `/migrate-cypress`, and `/debug-test` skills.

## High-Level Principles

1. **Self-contained tests.** Each `test()` block must create its own resources, assert independently, and clean up after itself. Never rely on test execution order or shared mutable state. Exception: Strategy B allows sharing read-only resources via `beforeAll`/`afterAll` when per-test creation is too expensive.
2. **Use the most specific API.** Prefer `getByTestId()`, `getByRole()`, `getByText()`, `getByLabel()` over generic `page.locator()`. Use `page.locator('[data-test="..."]')` only when other methods don't apply.
3. **Leverage the framework.** Use existing page objects, clients, and fixtures. Search `e2e/pages/` before creating new page objects.
4. **Live verification.** Use Playwright MCP browser tools to verify selectors, navigation flows, and element presence against the live UI before finalizing code.

---

## Project Structure & File Conventions

```text
frontend/
  playwright.config.ts          # Config: testIdAttribute='data-test', viewport=1920x1080, timeout=120s
  e2e/
    fixtures/                   # Test fixtures (cleanup, k8sClient, testConfig)
      index.ts                  # Main fixture file. Exports test, expect
      cleanup-fixture.ts        # CleanupFixture implementation
    clients/
      kubernetes-client.ts      # KubernetesClient: all cluster API interactions
    pages/                      # Page objects. Extend BasePage
      base-page.ts              # Abstract base: robustClick, goTo, waitForLoadingComplete, etc.
      <feature>.ts              # Feature-specific page objects
    tests/                      # Test specs
      <package>/                # Grouped by Playwright project
        <name>.spec.ts          # Admin tests
        developer/              # Developer-persona tests
          <name>.spec.ts
    mocks/                      # Test data (TypeScript objects and YAML manifests)
    setup/                      # Global setup/teardown (auth, cluster, knative)
```

### Playwright Projects

Tests are grouped by project, which determines auth state and test directory:

| Project | Test directory | Auth |
|---------|---------------|------|
| `smoke` | `e2e/tests/smoke/` | admin |
| `console` | `e2e/tests/console/` | admin |
| `dev-console` | `e2e/tests/dev-console/` | admin |
| `helm` | `e2e/tests/helm/` | admin |
| `knative` | `e2e/tests/knative/` | admin |
| `olm` | `e2e/tests/olm/` | admin |
| `topology` | `e2e/tests/topology/` | admin |
| `webterminal` | `e2e/tests/webterminal/` | admin |

Projects with developer auth variants: `smoke-developer`, `dev-console-developer`, `topology-developer`, `webterminal-developer`. Developer tests go in a `developer/` subdirectory.

---

## Test Selectors

Config: `testIdAttribute: 'data-test'` in `playwright.config.ts`, so `page.getByTestId('x')` queries `[data-test="x"]`.

**Always use `page.getByTestId('x')`** for element selection. If a React element only has a legacy test attribute (`data-test-id`, `data-test-selector`, `data-test-action`, `data-test-dropdown-menu`, etc.) but no `data-test`, **add `data-test="<value>"` to the React component source** so `getByTestId()` can be used. Never remove legacy attributes since external consumers may depend on them.

### Locator Priority

1. `getByTestId('x')` for elements with `data-test`
2. `getByRole('button', { name: 'Save' })` for interactive elements by role
3. `getByText('text')` or `locator('selector', { hasText: 'text' })` for text content
4. `locator('css-selector')` as a last resort, for elements that cannot be located clearly by role or by text

### PatternFly wrapper elements

Some PatternFly components place `data-test` on a wrapper element, not the actionable child. For example, `TextInputGroup` wraps `<input>` in a `<div>` that carries `data-test`. If `getByTestId('x').fill()` fails with "Element is not an input", chain `.locator('input')` or `.getByRole('textbox')` to reach the actionable child.

```typescript
// WRONG: data-test is on the wrapper div, not the input
await this.page.getByTestId('console-select-search-input').fill(text);

// RIGHT: chain to the actual input element
await this.page.getByTestId('console-select-search-input').locator('input').fill(text);
```

### Adding `data-test` to React Components

When a React component has only a legacy test attribute:

1. Find the React component that renders the element.
2. Add `data-test="x"` alongside the existing legacy attribute.
3. In the page object, use `this.page.getByTestId('x')`.

```tsx
// Before
<div data-test-id="horizontal-link-Details">Details</div>

// After: data-test added, legacy preserved
<div data-test="horizontal-link-Details" data-test-id="horizontal-link-Details">Details</div>
```

**Custom React components vs DOM elements:** `data-test="x"` on a native DOM element (`<div>`, `<button>`) creates the attribute directly. On a custom React component (`<ConsoleSelect>`, `<Dropdown>`), it becomes a prop that may be silently ignored if the component doesn't forward it. Check the component's prop interface. Many PF/console components use a `dataTest` prop instead. Verify the attribute reaches the DOM with the browser inspector.

```tsx
// WRONG: data-test on custom component is a prop, not a DOM attribute
<ConsoleSelect data-test="my-select" />  // silently ignored

// RIGHT: use the component's dataTest prop
<ConsoleSelect dataTest="my-select" />   // forwarded to internal DOM element
```

In page objects, always use `getByTestId()` never reference legacy attributes directly:

```typescript
// WRONG: using legacy selector directly
private readonly resourceRows = this.page.locator('[data-test-rows="resource-row"]');

// RIGHT: use getByTestId (add data-test to React source if needed)
private readonly resourceRows = this.page.getByTestId('resource-row');
```

---

## Page Object Pattern

All page objects extend `BasePage` (located at `e2e/pages/base-page.ts`).

### BasePage Methods

| Method | Purpose |
|--------|---------|
| `goTo(url)` | Navigate and wait for load |
| `robustClick(locator, opts?)` | Click with retry logic for PatternFly overlay interception |
| `waitForLoadingComplete(timeout?)` | Wait for all loading indicators to clear |
| `navigateToTab(locator, timeout?)` | Navigate to a horizontal tab |
| `clickButtonByText(text)` | Click a button by visible text |
| `switchPerspective(target)` | Switch between Administrator and Developer perspectives |
| `ensureFormView(locator?)` | Ensure form view is active (vs YAML) |
| `getEditorContent()` / `setEditorContent(content)` | Monaco editor interaction |
| `locator(selector, opts?)` | Scoped locator creation |
| `retryOnError()` | Dismiss error pages and retry |

### Conventions

- Locators as `private readonly` properties using `getByTestId()` or `locator()`
- Expose locators to specs via getter methods (`getX(): Locator`) specs should not access private locators directly
- Actions as `async` methods returning `Promise<void>`
- Use `robustClick()` inside page objects for clicks; specs use plain `.click()`
- Never prefix methods or locators with `legacy` name for what they do
- Usually (always check this) Page Object methods accept human-readable identifiers (display names, resource names), not `Locator` objects from specs. If the page object owns full locator composition then take advantage of it.

```typescript
// WRONG: spec passes a Locator into page object
const row = operatorsPage.getOperatorRow(displayName);
await expect(operatorsPage.getStatus(row)).toContainText('Succeeded');

// RIGHT: page object accepts a string identifier and composes the locator internally
await expect(operatorsPage.getStatus(displayName)).toContainText('Succeeded');
```

```typescript
import type { Locator } from "@playwright/test";
import BasePage from "./base-page";

export class ClusterSettingsPage extends BasePage {
  private readonly detailsTab = this.page.getByTestId("horizontal-link-Details");
  private readonly pageHeading = this.page.getByTestId("cluster-settings-page-heading");

  async navigateToDetails(): Promise<void> {
    await this.goTo("/settings/cluster");
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }
}
```

---

## Fixtures Guide

**Do not maintain a static fixture inventory.** Instead read `frontend/e2e/fixtures/index.ts` and trace its imports to discover all available fixtures before writing a test. The fixture source files are the single source of truth.

### Core Concepts

- **`test` and `expect`** should always import from `e2e/fixtures`, NEVER from `@playwright/test`
- **Worker-scoped fixtures** are shared across all tests in a worker (e.g., `k8sClient`, `testConfig`). Use for expensive resources.
- **Test-scoped fixtures** are created fresh per test (e.g., `cleanup`, `page`). Use for per-test isolation.
- **Fixture composition** fixtures can depend on other fixtures. Playwright resolves the dependency graph automatically.

### Cleanup Pattern

The `cleanup` fixture tracks Kubernetes resources created during a test and deletes them automatically after the test completes.

```typescript
test('creates a resource', async ({ page, cleanup, k8sClient }) => {
  const ns = `test-${Date.now()}`;
  await k8sClient.createNamespace(ns);
  cleanup.trackNamespace(ns); // auto-deleted after test

  // ... test logic. Cleanup runs automatically
});
```

Track methods: `trackNamespace(name)`, `trackCustomResource(...)`, `trackClusterCustomResource(...)`, `track(resource)`.

### Creating New Fixtures

When adding a new fixture:

1. Define it in `frontend/e2e/fixtures/index.ts` by extending the `test` object.
2. Choose the right scope: `{ scope: 'worker' }` for shared expensive resources, `{ scope: 'test' }` for per-test isolation (default).
3. Follow the existing patterns in the file. Use/teardown pairs for cleanup.
4. Export the fixture from `index.ts` so tests can destructure it.

---

## Test Structure & Isolation

### Isolation Strategies

- **Strategy A: Fully Self-Contained (preferred)**

Each test creates its resources, runs assertions, and cleans up.

```typescript
import { test, expect } from "../../fixtures";

test.describe("Resource lifecycle", { tag: ["@admin"] }, () => {
  test("verify resource details", async ({ page, cleanup, k8sClient }) => {
    const ns = `test-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    await k8sClient.waitForNamespaceReady(ns);
    cleanup.trackNamespace(ns);

    await test.step("Create resource", async () => { /* ... */ });
    await test.step("Verify details", async () => { /* ... */ });
  });
});
```

Use when: tests are short enough that resource creation doesn't dominate runtime.

- **Strategy B: Shared Resources via `test.describe`**

When multiple tests need the same expensive resource:

```typescript
test.describe("Operator tests", { tag: ["@admin"] }, () => {
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `aut-operator-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test("verify installed", async ({ page }) => { /* ... */ });
  test("create operand", async ({ page }) => { /* ... */ });
});
```

Use when: multiple read-only tests share the same resource and creating it per-test would be too slow.

**Strategy C: API-Created Resources**

Use `k8sClient` in `test.beforeAll` to create resources via API (faster than UI), then run UI-only assertions in tests.

### `test.step()` vs Separate `test()` Blocks

- Use **`test.step()`** for sequential phases of a single workflow (create → configure → verify). Steps share state and if one fails, the whole test fails, which is correct when later steps depend on earlier ones.
- Use **separate `test()` blocks** for independently valuable assertions that don't depend on each other.
- The tradeoff is valid when independent scenarios share expensive setup (e.g., an installed operator or `page.route()` handler). If you choose steps over separate tests for this reason, document it in the test.

### Serial vs Parallel Execution

By default, tests within the same **file** run serially (`fullyParallel` is not set in `playwright.config.ts`). Tests across different files run in parallel across workers. Use `test.describe.configure({ mode: 'parallel' })` to override this within a describe block, but only when:

- Tests are truly independent: no shared mutable state, no overlapping namespaces
- Tests don't modify cluster-wide resources that could affect each other
- Each test creates and cleans up its own resources

**Do NOT use parallel mode** when:

- Tests share a namespace created in `beforeAll`
- Tests modify global cluster settings
- Tests depend on a specific cluster state set by earlier tests

```typescript
// Parallel-safe: each test creates its own namespace
test.describe("Independent CRUD tests", () => {
  test.describe.configure({ mode: 'parallel' });

  test("create configmap", async ({ page, cleanup, k8sClient }) => {
    const ns = `test-cm-${Date.now()}`;
    cleanup.trackNamespace(ns);
    // ...
  });

  test("create secret", async ({ page, cleanup, k8sClient }) => {
    const ns = `test-secret-${Date.now()}`;
    cleanup.trackNamespace(ns);
    // ...
  });
});
```

---

## What to Test

### Scoping Guidance

- **One user workflow per `test()`**, e.g., "create a ConfigMap and verify it appears in the list"
- **One feature area per `test.describe()`**, e.g., "ConfigMap CRUD operations"
- **Golden path first.** The primary happy path a user would follow
- **Edge cases on request.** Error states, empty states, boundary conditions only when explicitly asked

### Tags

Tags are optional. CI currently filters by Playwright **project** (`--project=smoke`, `--project=console`), not by `--grep @tag`. Many existing specs carry tags from Cypress/Gherkin migration (`@smoke`, `@regression`, `@admin`) but nothing in the pipeline consumes them.

**Don't add tags by default.** Only add them if they enable filtering that the project/directory structure doesn't already provide, e.g., `@smoke` to mark a subset of tests within a large project for fast feedback, or a feature-specific tag like `@yaml-editor` when a directory has many specs and you want to run a subset.

### Test Naming

Name tests by the user intent being verified, not by the implementation:

```typescript
// Good
test("creates a deployment with custom replicas")
test("shows validation error for invalid port number")

// Bad
test("test1")
test("click button and check text")
```

---

## Auto-Awaiting & Waits

Playwright action methods (`fill()`, `click()`, `check()`, `uncheck()`, `selectOption()`, `type()`, `press()`) **auto-wait for the element to be actionable** (visible, enabled, stable). `robustClick()` in page objects also auto-waits.

```typescript
// WRONG: redundant waitFor before an action
await input.waitFor({ state: 'visible' });
await input.fill('text');

// RIGHT: actions auto-wait
await input.fill('text');
await this.robustClick(action);

// RIGHT: custom timeout passed to the action
await input.fill('text', { timeout: 10_000 });

// RIGHT: waiting for state without acting (navigation confirmation, loading indicator)
// eslint-disable-next-line no-restricted-syntax
await page.getByTestId('loading-indicator').waitFor({ state: 'detached' });
```

Do NOT call `waitForLoadingComplete()` at the end of page object methods (e.g., after `selectProject()`). The caller's next action will auto-wait for whatever element it needs.

> **ESLint enforcement:** The `no-restricted-syntax` rule (defined in `packages/eslint-plugin-console/lib/config/playwright.js`, scoped to `e2e/**/*` in `eslint.config.ts`) warns on `.waitFor()` calls. Legitimate uses need `// eslint-disable-next-line no-restricted-syntax`.

### Condition-Based Waits

Never use `page.waitForTimeout()`. Always wait for a condition:

```typescript
// NEVER
await page.waitForTimeout(5000);

// ALWAYS: condition-based assertion
await expect(statusLocator).toContainText("Running", { timeout: 120_000 });

// or polling-based condition
await expect(async () => {
  const text = await statusLocator.textContent();
  expect(text).toContain("Running");
}).toPass({ timeout: 120_000 });
```

---

## Avoiding Flaky Tests

Flaky tests erode trust in the test suite. These patterns prevent the most common sources of intermittent failures in this project.

### Use `robustClick()` for clicks in page objects

PatternFly overlays, dropdowns, and loading spinners can intercept clicks. `robustClick()` retries with scroll-into-view and falls back to force-click. Always use it inside page objects. Specs use plain `.click()` since the page object should have already handled the tricky interactions.

### Wait for resources to be ready before navigating

After creating a namespace or resource via `k8sClient`, don't navigate to its page immediately. The resource may not be fully initialized. Use `k8sClient.waitForNamespaceReady(ns)` or `k8sClient.waitForDeploymentReady(name, ns)` before navigating to UI pages that depend on the resource.

```typescript
await k8sClient.createNamespace(ns);
await k8sClient.waitForNamespaceReady(ns);
// now safe to navigate
await page.goto(`/k8s/ns/${ns}/configmaps`);
```

### Handle post-save "Error loading" pages

After a create/save that redirects to a details page, the page may intermittently show an error state ("Error loading [Resource]") with a "Try again" button. This happens because the K8s API hasn't fully propagated the resource. This is not a loading indicator; `waitForLoadingComplete()` won't help because the error page is a fully rendered state.

Add a retry method to page objects that navigate to details pages after mutations:

```typescript
async waitForDetailsReady(contentLocator: Locator): Promise<void> {
  await this.waitForLoadingComplete();
  const tryAgain = this.page.getByRole('button', { name: 'Try again' });
  for (let attempt = 0; attempt < 5; attempt++) {
    // eslint-disable-next-line no-restricted-syntax
    if (await tryAgain.waitFor({ state: 'visible', timeout: 2_000 }).then(() => true).catch(() => false)) {
      await tryAgain.click();
      await this.waitForLoadingComplete();
      continue;
    }
    break;
  }
  await expect(contentLocator).toBeVisible({ timeout: 30_000 });
}
```

### Prefer `data-test` over CSS class selectors

CSS classes change across PatternFly versions (e.g., `.pf-v5-c-button` to `.pf-v6-c-button`). `data-test` attributes are stable. When a test relies on a CSS class for selection, check if a `data-test` attribute exists or can be added.

### Don't assert before loading completes

If a page has loading indicators, wait for them to clear before asserting on content. Use `waitForLoadingComplete()` only when you need to confirm loading finished without acting on an element. For actions (`click`, `fill`), Playwright auto-waits.

```typescript
// WRONG: assert while page might still be loading
await expect(page.getByTestId('resource-title')).toHaveText('my-app');

// RIGHT: navigate, then let the assertion's built-in retry handle timing
const details = new DetailsPage(page);
await details.goTo(`/k8s/ns/${ns}/deployments/my-app`);
await expect(details.title).toHaveText('my-app', { timeout: 30_000 });
```

### Use unique resource names per test

Append `Date.now()` or a unique suffix to namespace and resource names. Tests running in parallel across workers must not collide on resource names.

### Run tests 3 times before declaring them stable

A test that passes once may be flaky. suggest user to run with `--retries=0` at least three consecutive times. If it fails on any run, it has a timing or state issue that needs fixing.

---

## k8sClient & Cleanup Patterns

### All cluster interactions use `k8sClient`

Never use shell commands (`execSync`, `child_process`) when `k8sClient` has a method. Destructure `k8sClient` from test fixtures.

### `afterAll` must destructure fixtures

Always destructure fixtures directly in `test.afterAll` parameters. Never assign fixtures to closure variables in `beforeAll` and reference them in `afterAll`. The closure pattern bypasses Playwright's lifecycle and silently skips cleanup if setup fails.

```typescript
// WRONG: closure variable, silently skips cleanup if beforeAll failed
let k8sClient: KubernetesClient;
test.beforeAll(async ({ k8sClient: client }) => { k8sClient = client; });
test.afterAll(async () => {
  if (!k8sClient) return;
  await k8sClient.deleteNamespace(ns);
});

// RIGHT: fixture parameter, Playwright manages lifecycle
test.afterAll(async ({ k8sClient }) => {
  await k8sClient.deleteNamespace(ns);
});
```

### Cleanup methods swallow 404s

`deleteNamespace()`, `deleteCustomResource()`, and `deleteClusterCustomResource()` catch errors and silently swallow 404 "not found" responses. Do NOT wrap cleanup calls in try/catch.

However, when multiple independent deletions must all run, use `Promise.allSettled`. This is about non-404 errors: if a subscription delete throws a 500, you still want CSV cleanup to run.

```typescript
// WRONG: if first delete throws 500, remaining cleanup is skipped
test.afterAll(async ({ k8sClient }) => {
  await k8sClient.deleteCustomResource(gvk, ns, 'subscriptions', subName);
  const csvs = await k8sClient.listCustomResources(gvk, ns, 'clusterserviceversions');
  for (const csv of csvs) { await k8sClient.deleteCustomResource(gvk, ns, 'clusterserviceversions', csv.metadata.name); }
});

// RIGHT: list first (read-only), then fire all deletions independently
test.afterAll(async ({ k8sClient }) => {
  const csvs = await k8sClient.listCustomResources(gvk, ns, 'clusterserviceversions');
  await Promise.allSettled([
    k8sClient.deleteCustomResource(gvk, ns, 'subscriptions', subName),
    ...csvs.map(c =>
      k8sClient.deleteCustomResource(gvk, ns, 'clusterserviceversions', c.metadata.name),
    ),
  ]);
});
```

---

## Mocking with `page.route()`

When a test verifies multiple mock scenarios (e.g., compatible, incompatible, error), register the route handler once and swap data via a mutable reference. This avoids re-registering routes between steps.

```typescript
let activeMockData: MockType | null = null;

await page.route('**/api/endpoint/**', async (route) => {
  if (activeMockData) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(activeMockData),
    });
  } else {
    await route.abort();
  }
});

await test.step('Scenario A', async () => {
  activeMockData = makeScenarioA();
  await page.reload();
  // assert...
});

await test.step('Scenario B', async () => {
  activeMockData = makeScenarioB();
  await page.reload();
  // assert...
});
```

---

## Feature Gates & Platform Guards

### Feature gate skip

Tests that require a specific feature gate should read `SERVER_FLAGS` from the browser and skip if the gate is disabled. This must happen after navigation (so the page has loaded) but before assertions.

```typescript
const serverFlags = await page.evaluate(() => (window as any).SERVER_FLAGS ?? {});
test.skip(
  !serverFlags.someFeatureFlag,
  'Test requires the SomeFeature feature gate to be enabled',
);
```

### MicroShift guard

Tests using OLM APIs (`operators.coreos.com`) must skip on MicroShift clusters since these APIs are not available there. Use an API group availability check or tag with `[Skipped:MicroShift]`.

### No silent fallbacks in setup

If a test derives a value from the cluster (version, feature flag, resource name), it must fail explicitly when the value cannot be derived. Silent defaults produce misleading assertion failures downstream.

```typescript
// WRONG: silent fallback masks real problem
const versionMatch = releaseVersion.match(/^(\d+\.\d+)/);
const clusterMinorVersion = versionMatch ? versionMatch[1] : '4.18';

// RIGHT: fail fast with clear error
const versionMatch = releaseVersion.match(/^(\d+\.\d+)/);
if (!versionMatch) {
  throw new Error(`Unable to parse cluster minor version from: "${releaseVersion}"`);
}
const clusterMinorVersion = versionMatch[1];
```

---

## Playwright MCP & Self-Signed Certificates

OpenShift clusters use self-signed certificates. `browser_navigate` will fail with `ERR_CERT_AUTHORITY_INVALID`.

**Workaround:** Use `browser_run_code_unsafe` to create a context with `ignoreHTTPSErrors: true`:

```javascript
async (page) => {
  const browser = page.context().browser();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const p = await ctx.newPage();
    await p.goto('https://console-openshift-console.apps.<cluster>/');
    // interact with p, not the MCP's tracked page
  } finally {
    await ctx.close();
  }
}
```

The MCP's tracked page stays on `about:blank`. Use the `p` reference from the new context for all interactions. Login via the OAuth form if needed (fill `#inputUsername`, `#inputPassword`, submit).

---

## Validation Commands

```bash
# Type checking (from frontend/)
npx tsc --noEmit -p e2e/tsconfig.json

# Linting (from frontend/)
cd frontend && yarn eslint <file-paths>

# Run tests (from frontend/)
npx playwright test --project=<package> <spec-file> --retries=0

# Run developer tests (from frontend/)
npx playwright test --project=<package>-developer <spec-file> --retries=0
```

---

## Things to NEVER Do

- **Never import `test` or `expect` from `@playwright/test`** . Import from `e2e/fixtures`
- **Never use `page.waitForTimeout()`**. Find the condition to wait for
- **Never add `waitFor()` before an action**. `fill()`, `click()`, `check()` auto-wait for actionability
- **Never use legacy test attribute selectors** (`[data-test-id="..."]`, `[data-test-rows="..."]`). Add `data-test` to the React source and use `getByTestId()`
- **Never wrap k8sClient cleanup in try/catch**. Delete methods already swallow 404s. Use `Promise.allSettled` when multiple independent deletions must all run
- **Never assign fixtures to closure variables**. Destructure them directly in `test.afterAll`/`test.beforeAll` parameters
- **Never pass `Locator` objects from specs into page object  if the method accept the identifier**. Pass string identifiers; the page object composes locators internally
- **Never use silent fallbacks for derived values**. If a test derives data from the cluster (version, feature flag), fail explicitly when the value cannot be parsed
- **Never prefix methods with `legacy`**. Name for what they do
- **Never put locators in spec files** when a page object exists or should exist
- **Never rely on test order**. Each `test()` must work independently
- **Never skip cleanup**. Every created resource must be tracked with `cleanup.track*()`
- **Never use shell commands** (`execSync`, `child_process`) when `k8sClient` has a method
