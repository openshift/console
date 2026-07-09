import { test, expect } from '../../fixtures';
import { QuickStartsPage } from '../../pages/dev-console/quick-starts-page';

test.describe(
  'Filter Quick Starts catalog',
  { tag: ['@dev-console', '@guided-tour'] },
  () => {
    let quickStartsPage: QuickStartsPage;

    test.beforeEach(async ({ page }) => {
      quickStartsPage = new QuickStartsPage(page);
      await quickStartsPage.navigateToCatalog();
    });

    test(
      'QS-01-TC01: Quick Starts catalog page has title and filters',
      { tag: ['@smoke'] },
      async () => {
        await test.step('Verify page title is visible', async () => {
          await expect(quickStartsPage.getPageTitle()).toBeVisible();
        });

        await test.step('Verify keyword filter is visible', async () => {
          await expect(quickStartsPage.getFilterInput()).toBeVisible();
        });

        await test.step('Verify status filter is visible', async () => {
          await expect(quickStartsPage.getStatusFilterToggle()).toBeVisible();
        });
      },
    );

    test(
      'QS-01-TC02: Filter by keyword shows matching quick start',
      { tag: ['@regression'] },
      async () => {
        await quickStartsPage.filterByKeyword('sample');
        await expect(
          quickStartsPage.getQuickStartCard('sample-application'),
        ).toBeVisible({ timeout: 10_000 });
      },
    );

    test(
      'QS-01-TC03: Status filter dropdown shows all status options',
      { tag: ['@regression'] },
      async () => {
        await quickStartsPage.openStatusFilter();

        await test.step('Verify all status options are visible', async () => {
          await expect(quickStartsPage.getStatusOption('Complete')).toBeVisible();
          await expect(quickStartsPage.getStatusOption('In progress')).toBeVisible();
          await expect(quickStartsPage.getStatusOption('Not started')).toBeVisible();
        });
      },
    );

    test(
      'QS-01-TC05: Filter with no matches shows empty state',
      { tag: ['@regression'] },
      async () => {
        await quickStartsPage.filterByKeyword('abcxyz123');

        await test.step('Verify empty state message', async () => {
          await expect(quickStartsPage.getEmptyState()).toBeVisible();
        });

        await test.step('Verify clear all filters button', async () => {
          await expect(quickStartsPage.getClearFilterButton()).toBeVisible();
        });
      },
    );
  },
);
