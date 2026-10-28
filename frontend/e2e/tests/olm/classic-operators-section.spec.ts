import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { CatalogPage } from '../../pages/catalog-page';
import { isTechPreview } from '../../utils/tech-preview';

const CATALOG_READY_TIMEOUT = 30_000;

/** Both Lifecycle versions share one catalog type; generation filtering is Technical Preview only. */
test.describe('Classic Operators', { tag: ['@admin'] }, () => {
  test('offers one Operators type in the Software Catalog', async ({ page }) => {
    await page.goto('/catalog/all-namespaces');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });

    const operatorType = new CatalogPage(page).getCatalogType('operator');
    await expect(operatorType).toHaveCount(1);
    await expect(operatorType.getByRole('link', { name: /^Operators \(\d+\)$/ })).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('filters operators by lifecycle version under Technical Preview', async ({ page }) => {
    await warmupSPA(page);
    test.skip(!(await isTechPreview(page)), 'Cluster extensions are Technical Preview only');

    await page.goto('/catalog/all-namespaces?catalogType=operator');
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });

    const olmv0Filter = page.getByRole('radio', { name: /Classic Operators/ });
    const olmv1Filter = page.getByRole('radio', { name: /Cluster extensions/ });
    await expect(olmv0Filter).toBeVisible();
    await expect(olmv1Filter).toBeVisible();
    await expect(olmv1Filter).toBeChecked();
    await expect(page.getByRole('radio').first()).toHaveAccessibleName(/Cluster extensions/);

    await olmv0Filter.check();
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible();

    await olmv1Filter.check();
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
    await expect(olmv0Filter).not.toBeChecked();

    await olmv0Filter.check();
    await expect(olmv1Filter).not.toBeChecked();
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
    await expect(new CatalogPage(page).getCatalogHeading()).toHaveText('Operators');
  });

  test('shows the migration warning in the details panel under Technical Preview', async ({
    page,
  }) => {
    await warmupSPA(page);
    test.skip(!(await isTechPreview(page)), 'The migration warning is Technical Preview only');

    await page.goto(
      '/catalog/all-namespaces?catalogType=operator&operatorCatalog=%5B%22Classic%20Operators%22%5D',
    );
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });

    // CatalogTile renders data-test as `${type}-${name}`.
    const firstOperatorCard = page.locator('[data-test^="operator-"]').first();
    await expect(firstOperatorCard).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });

    await firstOperatorCard.click();
    await expect(
      page.getByRole('dialog').getByTestId('classic-operator-migration-alert'),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('hides the migration warning outside Technical Preview', async ({ page }) => {
    await warmupSPA(page);
    test.skip(await isTechPreview(page), 'Skipping, only needed outside Technical Preview');

    await page.goto(
      '/catalog/all-namespaces?catalogType=operator&operatorCatalog=%5B%22Classic%20Operators%22%5D',
    );
    await expect(page.getByTestId('search-catalog')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });

    const firstOperatorCard = page.locator('[data-test^="operator-"]').first();
    await expect(firstOperatorCard).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });

    await firstOperatorCard.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
  });

  test('defaults Installed Operators to the Cluster extensions tab', async ({ page }) => {
    await warmupSPA(page);
    test.skip(
      !(await isTechPreview(page)),
      'The tabbed Installed Operators page is Technical Preview',
    );

    await page.goto('/installed-operators/all-namespaces');

    await expect(
      page
        .getByTestId('page-heading')
        .getByRole('heading', { name: 'Installed Operators', exact: true }),
    ).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    const tabs = page.getByRole('tab');
    await expect(tabs.first()).toContainText('Cluster extensions');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('button', { name: 'About Operator Lifecycle Manager version 1' }),
    ).toBeVisible();
  });

  test('shows the migration warning on the Classic Installed Operators tab', async ({ page }) => {
    await warmupSPA(page);
    test.skip(!(await isTechPreview(page)), 'The Installed Operators page is Technical Preview');

    await page.goto('/installed-operators/all-namespaces/classic');
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('serves the ClusterServiceVersion list URL as the Classic tab under Technical Preview', async ({
    page,
  }) => {
    await warmupSPA(page);
    test.skip(
      !(await isTechPreview(page)),
      'The tabbed Installed Operators page is Technical Preview',
    );

    await page.goto('/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion');

    await expect(page).toHaveURL(
      /\/k8s\/all-namespaces\/operators\.coreos\.com~v1alpha1~ClusterServiceVersion/,
    );
    await expect(page.getByRole('tab', { name: 'Classic Operators' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: CATALOG_READY_TIMEOUT },
    );
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeVisible({
      timeout: CATALOG_READY_TIMEOUT,
    });
  });

  test('serves the ClusterExtension list URL as the OLMv1 tab under Technical Preview', async ({
    page,
  }) => {
    await warmupSPA(page);
    test.skip(
      !(await isTechPreview(page)),
      'The tabbed Installed Operators page is Technical Preview',
    );

    await page.goto('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension');

    await expect(page).toHaveURL(/\/k8s\/cluster\/olm\.operatorframework\.io~v1~ClusterExtension/);
    await expect(page.getByRole('tab', { name: 'Cluster extensions' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: CATALOG_READY_TIMEOUT },
    );
  });

  test('keeps the ClusterServiceVersion list URL in place outside Technical Preview', async ({
    page,
  }) => {
    await warmupSPA(page);
    test.skip(await isTechPreview(page), 'Technical Preview redirects this URL');

    await page.goto('/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion');

    await expect(page).toHaveURL(
      /\/k8s\/all-namespaces\/operators\.coreos\.com~v1alpha1~ClusterServiceVersion/,
    );
    await expect(page.getByTestId('page-heading')).toBeVisible({ timeout: CATALOG_READY_TIMEOUT });
    await expect(page.getByTestId('classic-operator-migration-alert')).toBeHidden();
  });
});
