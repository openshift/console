# Tech Preview E2E Test Filtering Design

**Date:** 2026-07-16  
**Status:** Approved (updated to include per-feature-gate support)

## Goal

Populate `test-prow-e2e-techpreview.sh` and `test-prow-playwright-e2e-techpreview.sh` so that CI
jobs running against `TechPreviewNoUpgrade` clusters execute only the tests that specifically
require tech preview or a specific feature gate to be enabled, and skip everything else.

A test can declare one of two levels of dependency:

- **TechPreview overall** — the entire `TechPreviewNoUpgrade` feature set must be on.
- **Specific feature gate** — a named gate (e.g. `OLMv1`, `NodeSwap`) must be enabled. Tests at
  this level run on *any* cluster where the gate is enabled, regardless of whether the gate is in
  TechPreview or has graduated to GA.

This lets a test continue to run correctly after its feature gate graduates without changing the
test itself.

## Background

- `SERVER_FLAGS.techPreview` (boolean) — set by the server when the cluster's FeatureGate
  `featureSet` is `TechPreviewNoUpgrade`.
- The OpenShift FeatureGate CR (`config.openshift.io/v1`, cluster-scoped) tracks individual gate
  states. `.status.featureGates[]` lists enabled/disabled gates per feature set; the current
  cluster's active gates are the ones corresponding to `.spec.featureSet`.
- `oc get featuregate cluster -o jsonpath={.spec.featureSet}` returns `TechPreviewNoUpgrade` on
  tech-preview clusters, or empty string on standard clusters.
- Playwright already uses `{ tag: […] }` annotations (`@admin`, `@smoke`, etc.) and supports
  `--grep` for tag-based filtering.
- Cypress uses a `before()` / `cy.exec` pattern (see
  `frontend/packages/dev-console/integration-tests/support/commands/hooks.ts`) to skip entire
  suites based on the cluster's feature set.
- `KubernetesClient` (`frontend/e2e/clients/kubernetes-client.ts`) exposes `customObjectsApi` but
  only has `getCustomResource` (namespaced); a `getClusterCustomResource` method needs to be added.

## Tag Convention

| Tag | Meaning |
|-----|---------|
| `@tech-preview` | Test requires `SERVER_FLAGS.techPreview === true` (TechPreviewNoUpgrade overall) |
| `@feature-gate` | Test requires a specific named feature gate; fixture determines which and enforces it |

Both tags are included in the techpreview scripts. The `@feature-gate` tag is also included in the
regular scripts so tests naturally start passing there as gates graduate to GA — no script change
needed at graduation time.

Example:

```ts
// Requires TechPreview overall
test.describe('OLMv1 catalog', { tag: ['@admin', '@tech-preview'] }, () => { … });

// Requires a specific feature gate (runs on TP and GA once the gate graduates)
test.describe('NodeSwap scheduling', { tag: ['@admin', '@feature-gate'] }, () => { … });
```

## Playwright Design

### `techPreviewOnly` fixture

Added to the `TestFixtures` type and `base.extend()` chain in `frontend/e2e/fixtures/index.ts`.
Reads `SERVER_FLAGS.techPreview` from the page and skips if the cluster is not on TechPreview.

```ts
type TestFixtures = {
  cleanup: CleanupFixture;
  techPreviewOnly: void;
  requireFeatureGate: (gateName: string) => Promise<void>;
};

// In base.extend():
techPreviewOnly: async ({ page }, use) => {
  const isTechPreview = await page.evaluate(() => window.SERVER_FLAGS.techPreview);
  test.skip(!isTechPreview, 'This test requires a TechPreviewNoUpgrade cluster');
  await use();
},
```

### `requireFeatureGate` fixture

Also added to `fixtures/index.ts`. Returns a callable that a test invokes with the gate name it
needs. Queries the FeatureGate cluster CR via `KubernetesClient` and skips if the gate is not in
the enabled list for the cluster's active feature set.

```ts
requireFeatureGate: async ({ k8sClient }, use) => {
  await use(async (gateName: string) => {
    const fg = await k8sClient.getClusterCustomResource(
      'config.openshift.io', 'v1', 'featuregates', 'cluster',
    );
    const featureSet: string = fg?.spec?.featureSet ?? '';
    const section = (fg?.status?.featureGates ?? []).find(
      (s: any) => s.featureSet === featureSet,
    );
    const enabled: string[] = (section?.enabled ?? []).map((g: any) => g.name);
    test.skip(!enabled.includes(gateName), `Feature gate '${gateName}' is not enabled on this cluster`);
  });
},
```

Usage in a test:

```ts
test('NodeSwap pod scheduling', async ({ page, requireFeatureGate }) => {
  await requireFeatureGate('NodeSwap');
  // … rest of test
});
```

### `KubernetesClient.getClusterCustomResource`

A new method on `KubernetesClient` using the existing `customObjectsApi` to fetch cluster-scoped
custom resources (FeatureGate, ClusterVersion, etc.):

```ts
async getClusterCustomResource(
  group: string,
  version: string,
  plural: string,
  name: string,
): Promise<any> {
  return this.coApi.getClusterCustomObject({ group, version, plural, name });
}
```

### `test-prow-playwright-e2e-techpreview.sh`

Mirrors `test-prow-playwright-e2e.sh` (same env setup, same artifact copy trap) but passes a grep
filter so only TechPreview or feature-gate tests run:

```bash
./integration-tests/test-playwright-e2e.sh -- --grep "@tech-preview|@feature-gate" "$@"
```

No new `playwright.config.ts` project needed.

### `test-prow-playwright-e2e.sh` (regular script — minor addition)

The regular script gains a `--grep @feature-gate` path so that feature-gate tests also run there.
On standard clusters, the `requireFeatureGate` fixture skips any test whose gate is not yet
enabled; as gates graduate the tests pass automatically.

```bash
# In the e2e/release branch of the regular script:
./integration-tests/test-playwright-e2e.sh -- --grep @feature-gate "$@"
```

This is added as a new scenario or combined with the existing `e2e` scenario — exact wiring to
be decided at implementation time based on CI job structure.

## Cypress Design

### Inverted guard hook — TechPreview overall

A new shared support helper at `frontend/integration-tests/support/tech-preview-guard.ts`.
Skips the entire Cypress suite if the cluster is *not* on TechPreview:

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

### Inverted guard hook — specific feature gate

An additional helper (same file or a companion `feature-gate-guard.ts`) that accepts a gate name
and skips the suite unless that gate appears in the enabled list:

```ts
export function requireFeatureGate(gateName: string): void {
  before(function () {
    cy.exec(
      `oc get featuregate cluster -o jsonpath='{.status.featureGates[*].enabled[*].name}'`,
      { failOnNonZeroExit: false },
    ).then((result) => {
      const enabled = result.stdout.split(/\s+/).filter(Boolean);
      if (!enabled.includes(gateName)) {
        this.skip();
      }
    });
  });
}
```

Cypress packages call this in their support entry point alongside the TechPreview guard.

### `test-prow-e2e-techpreview.sh`

Mirrors `test-prow-e2e.sh` (same env setup, same `create-user.sh` and CSP check) but runs only
the Cypress packages that have TechPreview or feature-gate suites:

```bash
./integration-tests/test-cypress.sh -p olm -h true
```

Additional packages are added here as tech-preview / feature-gate Cypress tests are written.

## File Inventory

| File | Action |
|------|--------|
| `test-prow-playwright-e2e-techpreview.sh` | Populate (mirrors playwright script + `--grep "@tech-preview\|@feature-gate"`) |
| `test-prow-e2e-techpreview.sh` | Populate (mirrors cypress script + TP/feature-gate packages only) |
| `frontend/e2e/fixtures/index.ts` | Add `techPreviewOnly` and `requireFeatureGate` fixtures |
| `frontend/e2e/clients/kubernetes-client.ts` | Add `getClusterCustomResource` method |
| `frontend/integration-tests/support/tech-preview-guard.ts` | Create — TechPreview Cypress guard + `requireFeatureGate` helper |

## How Tests Participate

### Playwright — TechPreview overall

1. Add `@tech-preview` to the `test.describe` or `test()` tags.
2. Add `techPreviewOnly` to the fixture destructuring list.
3. Remove any manual `test.skip(isTechPreview, …)` guard — the fixture handles it.

### Playwright — specific feature gate

1. Add `@feature-gate` to the tags.
2. Call `await requireFeatureGate('GateName')` as the first line of the test body.

### Cypress — TechPreview overall

1. Import `tech-preview-guard` in the package's support entry point.
2. Add the package to `test-prow-e2e-techpreview.sh`.

### Cypress — specific feature gate

1. Call `requireFeatureGate('GateName')` in the package's support entry point (or individual spec
   `before()` if only some tests in the package need it).
2. Add the package to `test-prow-e2e-techpreview.sh`.

## Lifecycle: Feature Gate Graduation

When a gate graduates from TechPreview to GA:

- **Playwright**: no test change needed. The `requireFeatureGate` fixture will find the gate in the
  enabled list on GA clusters, and the test already runs via `--grep @feature-gate` in the regular
  script.
- **Cypress**: no test change needed. The `requireFeatureGate` guard passes on GA clusters once the
  gate is in the enabled list.
- **What does change**: the gate may move from `.status.featureGates[featureSet=TechPreviewNoUpgrade].enabled`
  to being enabled by default (not listed as disabled in any feature set). The fixture and guard
  both check the enabled list, so this is transparent.
