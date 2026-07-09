import { test, expect } from '../../fixtures';
import { ClusterCustomizationPage } from '../../pages/dev-console/cluster-customization-page';

test.describe('Cluster configuration customization', { tag: ['@dev-console', '@regression'] }, () => {
  let customizationPage: ClusterCustomizationPage;

  test.beforeEach(async ({ page }) => {
    customizationPage = new ClusterCustomizationPage(page);
    await customizationPage.navigateToCustomize();
    await expect(customizationPage.getHeading()).toBeVisible({ timeout: 30_000 });
  });

  test.skip(true, 'DC-01-TC01: Disable Developer catalog — deferred to a future batch');
  test.skip(true, 'DC-01-TC02: Disable specific sub-catalogs — deferred to a future batch');
  test.skip(true, 'DC-01-TC03: Disable Add page items — deferred to a future batch');
  test.skip(true, 'DC-01-TC04: Re-enable catalogs after disabling — deferred to a future batch');
  test.skip(true, 'DC-01-TC05: Verify console rollout after customization — deferred to a future batch');

  test('verifies perspectives section on General tab', async () => {
    await expect(customizationPage.getPerspectivesSection()).toBeVisible();
    await expect(customizationPage.getPerspectiveSectionItem('Developer')).toBeVisible();
  });

  test('verifies Developer tab shows pre-pinned navigation', async ({ page }) => {
    await customizationPage.getTab('Developer').click();
    await expect(page.getByText('Pre-pinned navigation items')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Available Resources')).toBeVisible();
    await expect(page.getByText('Pinned Resources', { exact: true })).toBeVisible();
  });
});
