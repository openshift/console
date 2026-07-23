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

  // eslint-disable-next-line playwright/expect-expect
  test('QS-03-TC01: Build with guided documentation card on Add page', async () => {
    test.skip(true, 'Original Cypress file tagged @broken-test — deferred');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('QS-03-TC03: Quick start completed state shows Complete label', async () => {
    test.skip(true, 'Original Cypress file tagged @broken-test — deferred');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('QS-03-TC04: Quick start in-progress state shows In Progress label', async () => {
    test.skip(true, 'Original Cypress file tagged @broken-test — deferred');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('QS-03-TC05: Build with guided documentation card links with in-progress status', async () => {
    test.skip(true, 'Original Cypress file tagged @broken-test — deferred');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('QS-03-TC07: Restart action on Quick Start card', async () => {
    test.skip(true, 'Original Cypress file tagged @broken-test — deferred');
  });

  test(
    'QS-03-TC10: Quick start sidebar opens via URL with quickstart parameter',
    { tag: ['@regression'] },
    async ({ page }) => {
      await warmupSPA(page);
      const quickStarts = new QuickStartsPage(page);

      await test.step('Navigate to quick starts catalog with quickstart query parameter', async () => {
        await quickStarts.navigateToQuickStart('sample-application');
      });

      await test.step('Verify the quick start sidebar/drawer opens', async () => {
        const drawer = quickStarts.getDrawer();
        await expect(drawer).toBeVisible({ timeout: 30_000 });
      });

      await test.step('Verify the correct quick start is shown', async () => {
        const drawer = quickStarts.getDrawer();
        await expect(drawer).toContainText('sample application', { ignoreCase: true });
      });
    },
  );
});
