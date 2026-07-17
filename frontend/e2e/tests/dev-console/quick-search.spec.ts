import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { AddPage } from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/quick-search-add.feature
 *
 * Skipped scenarios:
 *   - A-11-TC07 (@regression) - Bindable resource (requires Service Binding + Crunchy Postgres operators)
 */

test.describe(
  'Quick search in Add page',
  { tag: ['@dev-console', '@regression'] },
  () => {
    const ns = `aut-add-qs-${Date.now()}`;
    let addPage: AddPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await warmupSPA(page);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('Add to project button shows search bar [A-11-TC01]', async () => {
      await test.step('Click Add to project', async () => {
        await addPage.clickAddToProject();
      });

      await test.step('Verify search bar is visible', async () => {
        await expect(addPage.getQuickSearchInput()).toBeVisible({ timeout: 10_000 });
      });
    });

    test('View all results option for search [A-11-TC03]', async ({ page }) => {
      await test.step('Search for django', async () => {
        await addPage.clickAddToProject();
        await addPage.getQuickSearchInput().fill('django');
      });

      await test.step('Click view all and verify catalog', async () => {
        const viewAllLink = addPage.getViewAllLink();
        await expect(viewAllLink).toBeVisible({ timeout: 10_000 });
        await viewAllLink.click();
        await expect(page).toHaveURL(/\/catalog\//, { timeout: 15_000 });
      });
    });

    test('No results for invalid search [A-11-TC04]', async () => {
      await test.step('Search for nonsense string', async () => {
        await addPage.clickAddToProject();
        await addPage.getQuickSearchInput().fill('abcdef');
      });

      await test.step('Verify no results message', async () => {
        await expect(addPage.getNoResultsMessage()).toBeVisible({ timeout: 10_000 });
      });
    });
  },
);

test.describe(
  'Quick search smoke tests',
  { tag: ['@dev-console', '@smoke'] },
  () => {
    const ns = `aut-add-qs-smoke-${Date.now()}`;
    let addPage: AddPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await warmupSPA(page);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('Add to project button shows search bar [A-11-TC01]', async () => {
      await addPage.clickAddToProject();
      await expect(addPage.getQuickSearchInput()).toBeVisible({ timeout: 10_000 });
    });
  },
);
