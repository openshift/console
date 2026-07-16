# Tech Preview E2E Test Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate `test-prow-e2e-techpreview.sh` and `test-prow-playwright-e2e-techpreview.sh` with filtering logic so CI only runs tests that explicitly require TechPreview or a specific named feature gate.

**Architecture:** Two Playwright fixtures (`techPreviewOnly`, `requireFeatureGate`) are added to the shared fixture file so any test can opt-in with a tag + fixture call. The CI scripts pass `--grep "@tech-preview|@feature-gate"` to select those tests. Cypress gets a shared `before()` guard module that skips the suite unless the cluster is in the expected state; the Cypress script runs only packages that contain TechPreview/feature-gate suites.

**Tech Stack:** Playwright (`@playwright/test`), Cypress, Bash, `@kubernetes/client-node` (already a dependency), OpenShift `config.openshift.io/v1 FeatureGate` cluster CR.

## Global Constraints

- All commands run from repo root unless stated otherwise.
- Playwright commands run from `frontend/`.
- `getClusterCustomResource(group, version, plural, name)` already exists on `KubernetesClient` at `frontend/e2e/clients/kubernetes-client.ts:548` — do not add a duplicate.
- Tag names are lowercase with `@` prefix: `@tech-preview`, `@feature-gate`.
- `fixtures/index.ts` exports a single `test` object via `base.extend()` — all new fixtures must be added to that same chain, not in separate files.
- Never import from package index files (e.g. `@console/shared`); import from specific paths.
- Run `cd frontend && yarn tsc --noEmit` after every TypeScript change to catch type errors before committing.

---

### Task 1: Playwright fixtures — `techPreviewOnly` + `requireFeatureGate`

**Files:**
- Modify: `frontend/e2e/fixtures/index.ts`

**Interfaces:**
- Produces:
  - `techPreviewOnly: void` — test fixture; no parameters; skips the test if `SERVER_FLAGS.techPreview` is falsy
  - `requireFeatureGate: (gateName: string) => Promise<void>` — test fixture; call with a gate name string to skip if that gate is not in the cluster's enabled list

- [ ] **Step 1: Add `techPreviewOnly` and `requireFeatureGate` to `TestFixtures` type**

Open `frontend/e2e/fixtures/index.ts`. Replace the existing `TestFixtures` type:

```ts
type TestFixtures = {
  cleanup: CleanupFixture;
  techPreviewOnly: void;
  requireFeatureGate: (gateName: string) => Promise<void>;
};
```

- [ ] **Step 2: Add `techPreviewOnly` fixture implementation to `base.extend()`**

Inside `base.extend<TestFixtures, WorkerFixtures>({ … })`, add after the `cleanup` fixture:

```ts
  techPreviewOnly: async ({ page }, use) => {
    const isTechPreview = await page.evaluate(() => window.SERVER_FLAGS.techPreview);
    test.skip(!isTechPreview, 'This test requires a TechPreviewNoUpgrade cluster');
    await use();
  },
```

- [ ] **Step 3: Add `requireFeatureGate` fixture implementation to `base.extend()`**

Add after `techPreviewOnly`:

```ts
  requireFeatureGate: async ({ k8sClient }, use) => {
    await use(async (gateName: string) => {
      let enabled: string[] = [];
      try {
        const fg = await k8sClient.getClusterCustomResource(
          'config.openshift.io',
          'v1',
          'featuregates',
          'cluster',
        );
        const featureSet: string = (fg as any)?.spec?.featureSet ?? '';
        const sections: any[] = (fg as any)?.status?.featureGates ?? [];
        const section = sections.find((s: any) => s.featureSet === featureSet);
        enabled = (section?.enabled ?? []).map((g: any) => String(g.name));
      } catch {
        // If the CR can't be read, skip rather than fail
      }
      test.skip(
        !enabled.includes(gateName),
        `Feature gate '${gateName}' is not enabled on this cluster`,
      );
    });
  },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && yarn tsc --noEmit
```

Expected: no errors. If errors appear, check that `test` (the extended object) is in scope where `test.skip` is called — it should be because `base.extend` returns `test` which is re-used as the export.

> **Note:** `test.skip` inside a fixture body is valid in Playwright and causes the test to be reported as skipped. Do not use `base.skip`; use `test.skip` (the exported object from `base.extend`).

- [ ] **Step 5: Verify the fixture names appear in the exported `test` type**

```bash
cd frontend && node -e "const {test} = require('./e2e/fixtures'); console.log(typeof test)"
```

Expected: `function` (no import errors). If this fails with a module error, run `yarn build` first or rely on the `tsc --noEmit` check above — the runtime check is optional.

- [ ] **Step 6: Commit**

```bash
git add frontend/e2e/fixtures/index.ts
git commit -m "NO-ISSUE: Add techPreviewOnly and requireFeatureGate Playwright fixtures"
```

---

### Task 2: Example TechPreview Playwright test

Write the first test that uses `@tech-preview` + `techPreviewOnly` so the tag/fixture pattern is validated end-to-end, and CI has at least one test to run. This test verifies that the OLMv1 Software Catalog page is reachable on TechPreview clusters (where OLMv1 replaces the OLMv0 OperatorHub).

**Files:**
- Create: `frontend/e2e/tests/olm/olmv1-catalog.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect` from `../../fixtures` (Task 1); `{ tag: ['@admin', '@tech-preview'] }` Playwright annotation

- [ ] **Step 1: Create `frontend/e2e/tests/olm/olmv1-catalog.spec.ts`**

```ts
import { test, expect } from '../../fixtures';

test.describe('OLMv1 Software Catalog', { tag: ['@admin', '@tech-preview'] }, () => {
  test('Software Catalog page is accessible on TechPreview clusters', async ({
    page,
    techPreviewOnly,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/k8s\/cluster\/clusterserviceversions|\/software-catalog/, {
      timeout: 30_000,
    });
  });
});
```

> **Why this test:** It is intentionally minimal — its only job is to confirm the fixture system works and give the CI job something to run. Richer OLMv1 tests should live here or in sibling spec files as the feature matures.

- [ ] **Step 2: Verify the test appears in the tagged list**

```bash
cd frontend && node_modules/.bin/playwright test --list --grep "@tech-preview" 2>&1 | head -30
```

Expected: the new test `OLMv1 Software Catalog › Software Catalog page is accessible …` appears in the output. If it doesn't, check that the tag spelling matches exactly.

- [ ] **Step 3: Run TypeScript check**

```bash
cd frontend && yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/tests/olm/olmv1-catalog.spec.ts
git commit -m "NO-ISSUE: Add OLMv1 catalog smoke test as first @tech-preview Playwright test"
```

---

### Task 3: Playwright CI scripts

Populate `test-prow-playwright-e2e-techpreview.sh` and add a `feature-gate` scenario to `test-prow-playwright-e2e.sh`.

**Files:**
- Modify: `test-prow-playwright-e2e-techpreview.sh`
- Modify: `test-prow-playwright-e2e.sh`

**Interfaces:**
- Consumes: `./integration-tests/test-playwright-e2e.sh` (existing inner script)
- Produces:
  - `test-prow-playwright-e2e-techpreview.sh` — runs `--grep "@tech-preview|@feature-gate"` tests
  - `test-prow-playwright-e2e.sh` — new `feature-gate` scenario that runs `--grep @feature-gate` tests

- [ ] **Step 1: Populate `test-prow-playwright-e2e-techpreview.sh`**

Replace the current 3-line stub with:

```bash
#!/usr/bin/env bash
#
# Prow / CI entrypoint for Playwright E2E against a TechPreview OpenShift cluster console.
# Runs only tests tagged @tech-preview or @feature-gate.
# Mirrors test-prow-playwright-e2e.sh: same env setup, same artifact handling.
#
# Usage:
#   ./test-prow-playwright-e2e-techpreview.sh [playwright test args...]
#
# Environment (typical Prow / installer):
#   ARTIFACT_DIR, INSTALLER_DIR, KUBEADMIN_PASSWORD_FILE  — same as test-prow-playwright-e2e.sh
#

set -exuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${REPO_ROOT}"

ARTIFACT_DIR=${ARTIFACT_DIR:-/tmp/artifacts}
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

if [ -z "$ARTIFACT_DIR" ]; then
  echo "Error: ARTIFACT_DIR is not set" >&2
  exit 1
fi
case "$ARTIFACT_DIR" in
  /) echo "Error: ARTIFACT_DIR must not be '/'" >&2; exit 1 ;;
  /*) ;;
  *) echo "Error: ARTIFACT_DIR must be an absolute path, got: $ARTIFACT_DIR" >&2; exit 1 ;;
esac

export ARTIFACT_DIR INSTALLER_DIR
mkdir -p "${ARTIFACT_DIR}"

# don't log kubeadmin-password
set +x
export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
set -x
export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

./contrib/create-user.sh

pushd frontend

./integration-tests/test-playwright-e2e.sh -- --grep "@tech-preview|@feature-gate" "$@"

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x test-prow-playwright-e2e-techpreview.sh
```

- [ ] **Step 3: Add `feature-gate` scenario to `test-prow-playwright-e2e.sh`**

In `test-prow-playwright-e2e.sh`, the `if/elif` block currently reads:

```bash
if [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./integration-tests/test-playwright-e2e.sh "$@"
elif [ "$SCENARIO" == "smoke" ]; then
  # End of script flags before Playwright's --project (test-playwright-e2e.sh only parses -c).
  ./integration-tests/test-playwright-e2e.sh -- --project=smoke "$@"
else
  echo "error: unknown scenario '$SCENARIO' (use: e2e, release, or smoke)" >&2
  exit 1
fi
```

Add a `feature-gate` branch and update the error message:

```bash
if [ "$SCENARIO" == "e2e" ] || [ "$SCENARIO" == "release" ]; then
  ./integration-tests/test-playwright-e2e.sh "$@"
elif [ "$SCENARIO" == "smoke" ]; then
  # End of script flags before Playwright's --project (test-playwright-e2e.sh only parses -c).
  ./integration-tests/test-playwright-e2e.sh -- --project=smoke "$@"
elif [ "$SCENARIO" == "feature-gate" ]; then
  # Run only tests tagged @feature-gate; the requireFeatureGate fixture skips any
  # test whose gate is not enabled on this cluster.
  ./integration-tests/test-playwright-e2e.sh -- --grep @feature-gate "$@"
else
  echo "error: unknown scenario '$SCENARIO' (use: e2e, release, smoke, or feature-gate)" >&2
  exit 1
fi
```

- [ ] **Step 4: Verify script syntax**

```bash
bash -n test-prow-playwright-e2e-techpreview.sh && echo "OK"
bash -n test-prow-playwright-e2e.sh && echo "OK"
```

Expected: `OK` for both.

- [ ] **Step 5: Commit**

```bash
git add test-prow-playwright-e2e-techpreview.sh test-prow-playwright-e2e.sh
git commit -m "NO-ISSUE: Populate Playwright techpreview CI script and add feature-gate scenario"
```

---

### Task 4: Cypress tech-preview guard + techpreview script

Create the shared Cypress guard module and populate `test-prow-e2e-techpreview.sh`.

**Files:**
- Create: `frontend/integration-tests/support/tech-preview-guard.ts`
- Modify: `test-prow-e2e-techpreview.sh`

**Interfaces:**
- Produces:
  - default export: `before()` hook that skips the entire suite unless `oc get featuregate cluster` returns `TechPreviewNoUpgrade`
  - named export `requireFeatureGate(gateName: string): void` — registers a `before()` hook that skips unless the named gate is in the cluster's enabled list

- [ ] **Step 1: Create `frontend/integration-tests/support/tech-preview-guard.ts`**

```ts
/**
 * Cypress support helpers for TechPreview and per-feature-gate guards.
 *
 * Usage (in a Cypress package's support entry point):
 *
 *   // Skip entire suite unless cluster is TechPreviewNoUpgrade:
 *   import './tech-preview-guard';
 *
 *   // Skip entire suite unless a specific feature gate is enabled:
 *   import { requireFeatureGate } from './tech-preview-guard';
 *   requireFeatureGate('OLMv1');
 */

before(function () {
  cy.exec('oc get featuregate cluster -o jsonpath={.spec.featureSet}', {
    failOnNonZeroExit: false,
  }).then((result) => {
    if (result.stdout.trim() !== 'TechPreviewNoUpgrade') {
      this.skip();
    }
  });
});

export function requireFeatureGate(gateName: string): void {
  before(function () {
    cy.exec(
      "oc get featuregate cluster -o jsonpath='{range .status.featureGates[*]}{range .enabled[*]}{.name}{\"\\n\"}{end}{end}'",
      { failOnNonZeroExit: false },
    ).then((result) => {
      const enabled = result.stdout
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!enabled.includes(gateName)) {
        this.skip();
      }
    });
  });
}
```

> **Note:** Importing this file as a side-effect (`import './tech-preview-guard'`) registers the TechPreview `before()` hook. Call `requireFeatureGate('GateName')` *in addition* if the test needs a specific gate beyond the global TechPreview flag.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && yarn tsc --noEmit
```

Expected: no errors. The file uses only Cypress globals (`cy`, `before`) which are declared by `@types/cypress`.

- [ ] **Step 3: Populate `test-prow-e2e-techpreview.sh`**

Replace the current 3-line stub with:

```bash
#!/usr/bin/env bash
#
# Prow / CI entrypoint for Cypress E2E against a TechPreview OpenShift cluster console.
# Runs only Cypress packages that contain TechPreview or feature-gate suites.
# Mirrors test-prow-e2e.sh: same env setup, same CSP check.
#
# Usage:
#   ./test-prow-e2e-techpreview.sh
#
# Environment (typical Prow / installer):
#   ARTIFACT_DIR, INSTALLER_DIR, KUBEADMIN_PASSWORD_FILE  — same as test-prow-e2e.sh
#
# Adding a new TechPreview Cypress package:
#   1. Import tech-preview-guard in the package's Cypress support entry point.
#   2. Add '-p <package>' to the invocation below.
#

set -exuo pipefail

INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

# don't log kubeadmin-password
set +x
export BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
set -x
export BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"

./contrib/create-user.sh

pushd frontend

# olm: OLMv1 UI is active on TechPreview clusters; OLMv1-specific tests live here.
# Add further packages as TechPreview / feature-gate Cypress tests are written.
./integration-tests/test-cypress.sh -p olm -h true

env NO_SANDBOX=true yarn test-puppeteer-csp

popd
```

- [ ] **Step 4: Make the Cypress script executable**

```bash
chmod +x test-prow-e2e-techpreview.sh
```

- [ ] **Step 5: Verify both script syntaxes**

```bash
bash -n test-prow-e2e-techpreview.sh && echo "OK"
```

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add frontend/integration-tests/support/tech-preview-guard.ts test-prow-e2e-techpreview.sh
git commit -m "NO-ISSUE: Add Cypress TechPreview guard and populate Cypress techpreview CI script"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `techPreviewOnly` Playwright fixture | Task 1 |
| `requireFeatureGate` Playwright fixture | Task 1 |
| `getClusterCustomResource` on KubernetesClient | Already exists at `kubernetes-client.ts:548` — no task needed |
| `@tech-preview` tag + example test | Task 2 |
| `test-prow-playwright-e2e-techpreview.sh` populated | Task 3 |
| `test-prow-playwright-e2e.sh` `feature-gate` scenario | Task 3 |
| Cypress `tech-preview-guard.ts` with global TechPreview guard | Task 4 |
| Cypress `requireFeatureGate` helper | Task 4 |
| `test-prow-e2e-techpreview.sh` populated | Task 4 |
| Feature gate graduation is transparent (no test change needed) | Handled by fixture logic in Task 1 |

**Placeholder scan:** No TBD, TODO, or "similar to" references. All code blocks are complete.

**Type consistency:**
- `requireFeatureGate: (gateName: string) => Promise<void>` — declared in `TestFixtures`, implemented in `base.extend()`, and called with `await requireFeatureGate('GateName')` in tests. Consistent.
- `techPreviewOnly: void` — declared in `TestFixtures`, destructured as `{ techPreviewOnly }` in tests. Consistent with the existing `cleanup` pattern.
- `k8sClient` is a `WorkerFixtures` member already defined in the same `base.extend()` — available as a dependency in the `requireFeatureGate` fixture body. Consistent.
