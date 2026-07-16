import { test, expect } from '../../fixtures';
import { ClusterCustomizationPage } from '../../pages/dev-console/cluster-customization-page';

test.describe('Cluster configuration customization', { tag: ['@dev-console', '@regression'] }, () => {
  let customizationPage: ClusterCustomizationPage;

  test.beforeEach(async ({ page }) => {
    customizationPage = new ClusterCustomizationPage(page);
    await customizationPage.navigateToCustomize();
    await expect(customizationPage.getHeading()).toBeVisible({ timeout: 30_000 });
  });

  // eslint-disable-next-line playwright/expect-expect
  test('DC-01-TC01: Disable Developer catalog', async () => {
    test.skip(true, 'Deferred to a future batch');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('DC-01-TC02: Disable specific sub-catalogs', async () => {
    test.skip(true, 'Deferred to a future batch');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('DC-01-TC03: Disable Add page items', async () => {
    test.skip(true, 'Deferred to a future batch');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('DC-01-TC04: Re-enable catalogs after disabling', async () => {
    test.skip(true, 'Deferred to a future batch');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('DC-01-TC05: Verify console rollout after customization', async () => {
    test.skip(true, 'Deferred to a future batch');
  });

  test('verifies perspectives section on General tab', async () => {
    await expect(customizationPage.getPerspectivesSection()).toBeVisible();
    await expect(customizationPage.getPerspectiveSectionItem('Developer')).toBeVisible();
  });

  test('verifies Developer tab shows pre-pinned navigation', async () => {
    await customizationPage.getTab('Developer').click();
    await expect(customizationPage.getPrePinnedSection()).toBeVisible({ timeout: 30_000 });
    await expect(customizationPage.getAvailableResources()).toBeVisible();
    await expect(customizationPage.getPinnedResources()).toBeVisible();
  });
});
