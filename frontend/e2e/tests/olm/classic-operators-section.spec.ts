import { test, expect } from '../../fixtures';
import { isTechPreview } from '../../utils/tech-preview';

const CATALOG_READY_TIMEOUT = 30_000;

/** Both Lifecycle versions share one catalog type; generation filtering is Tech Preview only. */
test.describe('Classic Operators', { tag: ['@admin'] }, () => {
  test('offers one Operators type in the Software Catalog', async ({ page }) => {
    await page.goto('/catalog/all-namespaces');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });

    await expect(page.getByText('Operators', { exact: true })).toBeVisible();
    await expect(page.getByText('Next-Gen Operators', { exact: true })).toBeHidden();
    await expect(page.getByText('Classic Operators', { exact: true })).toBeHidden();
  });

  test('filters operators by lifecycle version under Tech Preview', async ({ page }) => {
    await page.goto('/catalog/all-namespaces?catalogType=operator');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(!(await isTechPreview(page)), 'Next-Gen Operators are Tech Preview only');

    const classicFilter = page.getByTestId('olmGeneration-classic').getByRole('checkbox');
    const nextGenFilter = page.getByTestId('olmGeneration-next-gen').getByRole('checkbox');
    await expect(classicFilter).toBeVisible();
    await expect(nextGenFilter).toBeVisible();

    await classicFilter.check();
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible();
    await expect(page.getByTestId('Classic Operator-badge').first()).toBeVisible();
    await expect(page.getByTestId('Next-Gen Operator-badge')).toHaveCount(0);
    await classicFilter.uncheck();

    await nextGenFilter.check();
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
    await expect(page.getByTestId('Next-Gen Operator-badge').first()).toBeVisible();
    await expect(page.getByTestId('Classic Operator-badge')).toHaveCount(0);
  });

  test('redirects /operatorhub to the shared Operators catalog', async ({ page }) => {
    await page.goto('/operatorhub');
    await expect(page).toHaveURL(/\/catalog\/all-namespaces\?.*catalogType=operator/);
  });

  test('keeps existing ?catalogType=operator links working', async ({ page }) => {
    await page.goto('/catalog/all-namespaces?catalogType=operator');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    await expect(page.getByTestId('page-heading')).toHaveText('Operators');
  });

  test('badges Classic catalog items and warns in the details panel under Tech Preview', async ({
    page,
  }) => {
    await page.goto(
      '/catalog/all-namespaces?catalogType=operator&olmGeneration=%5B%22Classic%22%5D',
    );
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(!(await isTechPreview(page)), 'Classic badging is Tech Preview only');

    // CatalogTile renders data-test as `${type}-${name}`.
    const firstOperatorCard = page.locator('[data-test^="operator-"]').first();
    await expect(firstOperatorCard).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    await expect(firstOperatorCard.getByTestId('Classic Operator-badge')).toBeVisible();

    await firstOperatorCard.click();
    await expect(
      page.getByRole('dialog').getByTestId('classic-operator-migration-alert'),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('does not badge or warn on Classic catalog items outside Tech Preview', async ({ page }) => {
    await page.goto(
      '/catalog/all-namespaces?catalogType=operator&olmGeneration=%5B%22Classic%22%5D',
    );
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
    test.skip(await isTechPreview(page), 'Classic badging is Tech Preview only');

    const firstOperatorCard = page.locator('[data-test^="operator-"]').first();
    await expect(firstOperatorCard).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    await expect(firstOperatorCard.getByTestId('Classic Operator-badge')).toBeHidden();

    await firstOperatorCard.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
  });

  test('defaults Installed Operators to the Next-Gen Operators tab', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await isTechPreview(page)), 'The tabbed Installed Operators page is Tech Preview');

    await page.goto('/installed-operators/all-namespaces');

    await expect(page.getByTestId('page-heading')).toHaveText('Installed Operators');
    const tabs = page.getByRole('tab');
    await expect(tabs.first()).toContainText('Next-Gen Operators');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: 'OLMv1 information' })).toBeVisible();
  });

  test('shows the migration warning on the Classic Installed Operators tab', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await isTechPreview(page)), 'The tabbed Installed Operators page is Tech Preview');

    await page.goto('/installed-operators/all-namespaces/classic');
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('serves the ClusterServiceVersion list URL as the Classic tab under Tech Preview', async ({
    page,
  }) => {
    await page.goto('/');
    test.skip(!(await isTechPreview(page)), 'The tabbed Installed Operators page is Tech Preview');

    await page.goto('/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion');

    await expect(page).toHaveURL(
      /\/k8s\/all-namespaces\/operators\.coreos\.com~v1alpha1~ClusterServiceVersion/,
    );
    await expect(page.getByRole('tab', { name: 'Classic Operators' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('serves the ClusterExtension list URL as the Next-Gen tab under Tech Preview', async ({
    page,
  }) => {
    await page.goto('/');
    test.skip(!(await isTechPreview(page)), 'The tabbed Installed Operators page is Tech Preview');

    await page.goto('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension');

    await expect(page).toHaveURL(/\/k8s\/cluster\/olm\.operatorframework\.io~v1~ClusterExtension/);
    await expect(page.getByRole('tab', { name: 'Next-Gen Operators' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
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
