# Tech Preview E2E Test Filtering Design

**Date:** 2026-07-16  
**Status:** Approved

## Goal

Populate `test-prow-e2e-techpreview.sh` and `test-prow-playwright-e2e-techpreview.sh` so that CI
jobs running against `TechPreviewNoUpgrade` clusters execute only the tests that specifically
require tech preview to be enabled, and skip everything else.

The regular `test-prow-e2e.sh` / `test-prow-playwright-e2e.sh` already skip tech-preview-sensitive
tests via `test.skip(isTechPreview, …)`. The tech-preview scripts are the inverse: they run only
what the regular scripts would skip.

## Background

- `SERVER_FLAGS.techPreview` (boolean) — set by the server when the cluster's FeatureGate
  `featureSet` is `TechPreviewNoUpgrade`.
- `oc get featuregate cluster -o jsonpath={.spec.featureSet}` returns `TechPreviewNoUpgrade` on
  tech-preview clusters.
- Playwright already uses `{ tag: […] }` annotations (`@admin`, `@smoke`, etc.) and supports
  `--grep` for tag-based filtering.
- Cypress uses a `before()` / `cy.exec` pattern (see
  `frontend/packages/dev-console/integration-tests/support/commands/hooks.ts`) to skip entire
  suites based on the cluster's feature set.

## Playwright Design

### Tag convention

Any test that **requires** `TechPreviewNoUpgrade` carries the `@tech-preview` tag:

```ts
test.describe('OLMv1 catalog', { tag: ['@admin', '@tech-preview'] }, () => { … });
```

This is consistent with the existing `@admin`, `@smoke`, `@regression`, `@dev-console` tags
already in use.

### `techPreviewOnly` fixture

Added directly to the `TestFixtures` type and `base.extend()` chain in
`frontend/e2e/fixtures/index.ts`. This is a safety net: if a tagged test is accidentally run
against a regular cluster it fails fast with a clear message instead of a confusing assertion
error. No new file is needed.

```ts
// In TestFixtures:
type TestFixtures = {
  cleanup: CleanupFixture;
  techPreviewOnly: void;
};

// In base.extend():
techPreviewOnly: async ({ page }, use) => {
  const isTechPreview = await page.evaluate(() => window.SERVER_FLAGS.techPreview);
  test.skip(!isTechPreview, 'This test requires a TechPreviewNoUpgrade cluster');
  await use();
},
```

Tests opt in by destructuring the fixture — since all tests already import `test` from
`../../fixtures`, no extra import is needed:

```ts
test('OLMv1 catalog is visible', async ({ page, techPreviewOnly }) => { … });
```

### `test-prow-playwright-e2e-techpreview.sh`

Mirrors `test-prow-playwright-e2e.sh` exactly (same env setup, same artifact copy trap) with one
difference: it passes `--grep @tech-preview` to Playwright so only tagged tests run.

```bash
./integration-tests/test-playwright-e2e.sh -- --grep @tech-preview "$@"
```

No new `playwright.config.ts` project is needed. The existing projects (`olm`, `console`, etc.)
already cover the correct `testDir` paths; `--grep` filters within them.

## Cypress Design

### Inverted guard hook

A new shared support helper at
`frontend/integration-tests/support/tech-preview-guard.ts`:

```ts
before(function () {
  cy.exec('oc get featuregate cluster -o jsonpath={.spec.featureSet}', {
    failOnNonZeroExit: false,
  }).then((result) => {
    if (result.stdout.trim() !== 'TechPreviewNoUpgrade') {
      this.skip();
    }
  });
});
```

Cypress packages that contain tech-preview tests import this file in their support entry point.
Initially this is just the `olm` package (for OLMv1 UI tests).

### `test-prow-e2e-techpreview.sh`

Mirrors `test-prow-e2e.sh` (same env setup, same `create-user.sh` and CSP check) but calls only
the Cypress packages that have tech-preview suites:

```bash
./integration-tests/test-cypress.sh -p olm -h true
```

Additional packages are added here as tech-preview Cypress tests are written.

## File Inventory

| File | Action |
|------|--------|
| `test-prow-playwright-e2e-techpreview.sh` | Populate (mirrors playwright script + `--grep @tech-preview`) |
| `test-prow-e2e-techpreview.sh` | Populate (mirrors cypress script + tech-preview packages only) |
| `frontend/e2e/fixtures/index.ts` | Add `techPreviewOnly` to `TestFixtures` type and `base.extend()` |
| `frontend/integration-tests/support/tech-preview-guard.ts` | Create — inverted Cypress `before()` guard |

## How Tests Participate

### Playwright (new or existing test)

1. Add `@tech-preview` to the `test.describe` or `test()` tags.
2. Add `techPreviewOnly` to the fixture destructuring list.
3. Remove any manual `test.skip(isTechPreview, …)` guard — the fixture handles it.

### Cypress (new or existing test)

1. Add `import '../../../integration-tests/support/tech-preview-guard'` (or equivalent relative
   path) to the package's support entry point.
2. Add the package name to the `test-prow-e2e-techpreview.sh` invocation list.

## What This Does Not Cover

- **Per-feature-gate granularity:** A specific feature gate beyond the top-level `techPreview`
  flag (e.g., `NodeSwap`) is not handled. Future work could add per-gate fixtures
  (`nodeSwapOnly`, etc.) following the same pattern.
- **Playwright project isolation:** Running tech-preview tests in a dedicated Playwright project
  (e.g., `--project=tech-preview`) is not needed now but is a natural extension if the suite grows
  large enough to warrant a separate setup/teardown dependency chain.