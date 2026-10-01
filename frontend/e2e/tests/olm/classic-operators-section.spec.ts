import { test, expect } from '../../fixtures';
import { isTechPreview } from '../../utils/tech-preview';

const CATALOG_READY_TIMEOUT = 30_000;

/**
 * Splitting the operator catalog into Classic (OLMv0) and Next-Gen (OLMv1) types is Tech Preview
 * only. On a standard cluster there is no Next-Gen catalog to migrate to, so the single operator
 * catalog keeps its generic name and the Classic surfaces stay exactly where they were. Both
 * shapes are asserted here so a regression in either one fails.
 */
test.describe('Classic Operators', { tag: ['@admin'] }, () => {
  test('offers both Operator types in the Software Catalog under Tech Preview', async ({
    page,
  }) => {
    await page.goto('/catalog/all-namespaces');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(!(await isTechPreview(page)), 'Next-Gen Operators are Tech Preview only');

    await expect(page.getByText('Classic Operators')).toBeVisible();
    await expect(page.getByText('Next-Gen Operators')).toBeVisible();
  });

  test('offers a single, generically named Operators type outside Tech Preview', async ({
    page,
  }) => {
    await page.goto('/catalog/all-namespaces');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(await isTechPreview(page), 'Tech Preview splits the type in two');

    await expect(page.getByText('Operators', { exact: true })).toBeVisible();
    await expect(page.getByText('Next-Gen Operators')).toBeHidden();
    await expect(page.getByText('Classic Operators')).toBeHidden();
  });

  // The catalog type id was renamed on every cluster, so /operatorhub and legacy
  // ?catalogType=operator links must land on it regardless of Tech Preview.
  test('redirects /operatorhub to the OLMv0 catalog type', async ({ page }) => {
    await page.goto('/operatorhub');

    await expect(page).toHaveURL(/\/catalog\/all-namespaces\?.*catalogType=operator-olmv0/);
  });

  test('redirects legacy ?catalogType=operator links to the OLMv0 catalog type', async ({
    page,
  }) => {
    await page.goto('/catalog/all-namespaces?catalogType=operator');

    await expect(page).toHaveURL(/catalogType=operator-olmv0/);
  });

  test('badges Classic catalog items and warns in the details panel under Tech Preview', async ({
    page,
  }) => {
    await page.goto('/catalog/all-namespaces?catalogType=operator-olmv0');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(!(await isTechPreview(page)), 'Classic badging is Tech Preview only');

    // CatalogTile renders data-test as `${type}-${name}`.
    const firstOperatorCard = page.locator('[data-test^="operator-olmv0-"]').first();
    await expect(firstOperatorCard).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    await expect(firstOperatorCard.getByTestId('Classic Operator-badge')).toBeVisible();

    await firstOperatorCard.click();
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('does not badge or warn on Classic catalog items outside Tech Preview', async ({ page }) => {
    await page.goto('/catalog/all-namespaces?catalogType=operator-olmv0');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(await isTechPreview(page), 'Classic badging is Tech Preview only');

    const firstOperatorCard = page.locator('[data-test^="operator-olmv0-"]').first();
    await expect(firstOperatorCard).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    await expect(firstOperatorCard.getByTestId('Classic Operator-badge')).toBeHidden();

    await firstOperatorCard.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
  });

  test('shows the migration warning on the Classic Installed Operators tab', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await isTechPreview(page)), 'The tabbed Installed Operators page is Tech Preview');

    await page.goto('/installed-operators/all-namespaces/classic');
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('redirects the ClusterServiceVersion list URL to the Classic tab under Tech Preview', async ({
    page,
  }) => {
    await page.goto('/');
    test.skip(!(await isTechPreview(page)), 'The tabbed Installed Operators page is Tech Preview');

    await page.goto('/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion');

    await expect(page).toHaveURL(/\/installed-operators\/all-namespaces\/classic/);
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('keeps the ClusterServiceVersion list URL in place outside Tech Preview', async ({
    page,
  }) => {
    await page.goto('/');
    test.skip(await isTechPreview(page), 'Tech Preview redirects this URL');

    await page.goto('/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion');

    await expect(page).toHaveURL(
      /\/k8s\/all-namespaces\/operators\.coreos\.com~v1alpha1~ClusterServiceVersion/,
    );
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
  });
});
