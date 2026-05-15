import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { ModalPage } from '../../pages/modal-page';
import { createTestCatalogSource } from './mocks';

const managedCatalogSource = {
  name: 'redhat-operators',
  displayName: 'Red Hat Operators',
};

test.describe('CatalogSource details page', { tag: ['@admin'] }, () => {
  const testNs = `olm-catsrc-${Date.now()}`;
  let catalogSourceName: string;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(testNs);
    const catalogSource = createTestCatalogSource(testNs);
    catalogSourceName = catalogSource.metadata.name;
    await k8sClient.createCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      testNs,
      'catalogsources',
      catalogSource,
    );
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      testNs,
      'catalogsources',
      catalogSourceName,
    );
    await k8sClient.deleteNamespace(testNs);
  });

  async function navigateToCatalogSourcesList(page: import('@playwright/test').Page) {
    const detailsPage = new DetailsPage(page);

    await page.goto('/settings/cluster/globalconfig');
    await page
      .getByTestId('loading-indicator')
      .waitFor({ state: 'hidden' })
      .catch(() => {});
    const operatorHubLink = page.locator('[data-test-id="OperatorHub"]');
    await operatorHubLink.waitFor({ timeout: 120_000 });
    await operatorHubLink.scrollIntoViewIfNeeded();
    await operatorHubLink.click();
    await detailsPage.sectionHeaderShouldExist('OperatorHub details');
    await page.locator('[data-test-id="horizontal-link-Sources"]').click();
  }

  test(`renders details about the ${managedCatalogSource.name} catalog source`, async ({
    page,
  }) => {
    const detailsPage = new DetailsPage(page);
    await navigateToCatalogSourcesList(page);
    await page.locator(`[data-test-id="${managedCatalogSource.name}"]`).click();

    await detailsPage.sectionHeaderShouldExist('CatalogSource details');

    await expect(
      page.locator('[data-test-selector="details-item-value__Status"]'),
    ).toHaveText('READY', { timeout: 300_000 });

    await expect(page.locator('[data-test-selector="details-item-label__Name"]')).toBeVisible();
    await expect(page.locator('[data-test-selector="details-item-value__Name"]')).toHaveText(
      managedCatalogSource.name,
    );

    await expect(page.locator('[data-test-selector="details-item-label__Status"]')).toBeVisible();

    await expect(
      page.locator('[data-test-selector="details-item-label__Display name"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-test-selector="details-item-value__Display name"]'),
    ).toHaveText(managedCatalogSource.displayName);

    const pollIntervalLabel = page.getByTestId('Registry poll interval');
    await pollIntervalLabel.scrollIntoViewIfNeeded();
    await expect(pollIntervalLabel).toBeVisible();
    const pollIntervalValue = page.locator(
      '[data-test-selector="details-item-value__Registry poll interval"]',
    );
    await pollIntervalValue.scrollIntoViewIfNeeded();
    await expect(pollIntervalValue).toBeVisible();

    const numOperatorsLabel = page.locator(
      '[data-test-selector="details-item-label__Number of Operators"]',
    );
    await numOperatorsLabel.scrollIntoViewIfNeeded();
    await expect(numOperatorsLabel).toBeVisible();
    const numOperatorsValue = page.locator(
      '[data-test-selector="details-item-value__Number of Operators"]',
    );
    await numOperatorsValue.scrollIntoViewIfNeeded();
    await expect(numOperatorsValue).toBeVisible();
  });

  test(`lists package manifests for ${managedCatalogSource.name} under Operators tab`, async ({
    page,
  }) => {
    const detailsPage = new DetailsPage(page);
    await navigateToCatalogSourcesList(page);
    await page.locator(`[data-test-id="${managedCatalogSource.name}"]`).click();

    await detailsPage.sectionHeaderShouldExist('CatalogSource details');

    await page.locator('[data-test-id="horizontal-link-Operators"]').click();
    await expect(page.getByTestId('PackageManifestTable')).toBeAttached();
  });

  test('allows modifying registry poll interval on test catalog source', async ({ page }) => {
    const modalPage = new ModalPage(page);
    await navigateToCatalogSourcesList(page);
    await page.locator(`[data-test-id="${catalogSourceName}"]`).click();

    await page.getByTestId('Registry poll interval-details-item__edit-button').click();
    await expect(page.getByTestId('registry-poll-interval-modal-title')).toContainText(
      'Edit registry poll interval',
    );
    await page.getByTestId('registry-poll-interval-dropdown').click();
    await page.locator('[data-test-dropdown-menu="30m"]').waitFor({ state: 'visible' });
    await page.locator('[data-test-dropdown-menu="30m"]').click();
    await modalPage.submit();

    await expect(
      page.locator('[data-test-selector="details-item-value__Registry poll interval"]'),
    ).toHaveText('30m');
  });
});
