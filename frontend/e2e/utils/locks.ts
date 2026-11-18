/**
 * Named locks for shared cluster state.
 *
 * Playwright never runs two tests that declare the same lock at the same time, across files,
 * worker processes and projects, while unrelated tests keep running in parallel. Declare a lock
 * in a test's or a `test.describe`'s details:
 *
 * ```ts
 * test.describe('OperatorHub default sources', { tag: ['@admin'], lock: OLM_CLUSTER_STATE_LOCK }, () => {
 * ```
 *
 * @see https://playwright.dev/docs/test-parallel
 */

/**
 * Cluster-scoped Operator state: installing or uninstalling an Operator, or enabling and
 * disabling the default CatalogSources.
 *
 * Disabling a default source deletes that CatalogSource and every PackageManifest it provides,
 * out from under any spec that is reading them, and concurrent installs contend on the same
 * shared namespaces and on OLM itself. Note that in Playwright's default mode the tests of a
 * file run as a unit, so a lock declared on a describe is held for that whole file — which is
 * what these specs need, because they establish their operators in `beforeAll`.
 */
export const OLM_CLUSTER_STATE_LOCK = 'olm-cluster-state';
