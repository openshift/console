import { test, expect } from '../../fixtures';
import { ClusterCustomizationPage } from '../../pages/dev-console/cluster-customization-page';

test.describe('Cluster configuration customization', { tag: ['@dev-console', '@regression'] }, () => {
  let customizationPage: ClusterCustomizationPage;

  test.beforeEach(async ({ page }) => {
    customizationPage = new ClusterCustomizationPage(page);
    await customizationPage.navigateToCustomize();
    await expect(customizationPage.getHeading()).toBeVisible({ timeout: 30_000 });
  });

  test('verifies perspectives section on General tab', async () => {
    await expect(customizationPage.getPerspectivesSection()).toBeVisible();
    await expect(
      customizationPage.getPerspectivesSection().getByText('Developer'),
    ).toBeVisible();
  });

  test('verifies Developer tab shows pre-pinned navigation', async ({ page }) => {
    await customizationPage.getTab('Developer').click();
    await expect(page.getByText('Pre-pinned navigation items')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Available Resources')).toBeVisible();
    await expect(page.getByText('Pinned Resources', { exact: true })).toBeVisible();
  });
});
