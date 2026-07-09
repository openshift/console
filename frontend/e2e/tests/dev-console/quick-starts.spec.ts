import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { QuickStartsPage } from '../../pages/dev-console/quick-starts-page';

test.describe('Quick Starts - Developer Perspective', { tag: ['@dev-console'] }, () => {
  test(
    'QS-03-TC02: Quick starts catalog shows quick starts with duration info',
    { tag: ['@regression'] },
    async ({ page }) => {
      await warmupSPA(page);
      const quickStarts = new QuickStartsPage(page);

      await test.step('Navigate to Quick Starts catalog', async () => {
        await quickStarts.navigateToCatalog();
      });

      await test.step('Verify known quick starts are visible', async () => {
        await expect(
          quickStarts.getQuickStartCard('sample-application'),
        ).toBeVisible({ timeout: 30_000 });
        await expect(
          quickStarts.getQuickStartCard('add-healthchecks'),
        ).toBeVisible();
      });

      await test.step('Verify duration info is shown on cards', async () => {
        const sampleAppCard = quickStarts.getQuickStartCard('sample-application');
        await expect(sampleAppCard.getByText(/minutes/i)).toBeVisible();
      });
    },
  );

  test(
    'QS-03-TC10: Quick start sidebar opens via URL with quickstart parameter',
    { tag: ['@regression'] },
    async ({ page }) => {
      await warmupSPA(page);
      const quickStarts = new QuickStartsPage(page);

      await test.step('Navigate to quick starts catalog with quickstart query parameter', async () => {
        await page.goto('/quickstart?quickstart=sample-application');
        await page.waitForLoadState('domcontentloaded');
      });

      await test.step('Verify the quick start sidebar/drawer opens', async () => {
        const drawer = page.getByTestId('quickstart drawer');
        await expect(drawer).toBeVisible({ timeout: 30_000 });
      });

      await test.step('Verify the correct quick start is shown', async () => {
        const drawer = page.getByTestId('quickstart drawer');
        await expect(drawer).toContainText('sample application', { ignoreCase: true });
      });
    },
  );
});
