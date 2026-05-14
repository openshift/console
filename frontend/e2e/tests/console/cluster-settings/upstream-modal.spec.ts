import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';

test.describe('Cluster Settings upstream configuration modal', { tag: ['@admin'] }, () => {
  test('can be opened and closed', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    await test.step('Navigate to Cluster Settings', async () => {
      await clusterSettings.navigateToDetails();
    });

    await test.step('Click upstream URL to open modal', async () => {
      const upstreamServerUrl = page.getByTestId('cv-upstream-server-url');

      // Scroll to element and click
      await upstreamServerUrl.scrollIntoViewIfNeeded();
      await expect(upstreamServerUrl).toBeVisible();
      await upstreamServerUrl.click();

      // Verify modal opens
      const modalTitle = clusterSettings.getModalTitle();
      await expect(modalTitle).toBeVisible();
      await expect(modalTitle).toContainText('Edit upstream configuration');
    });

    await test.step('Close modal', async () => {
      const cancelButton = page.getByTestId('modal-cancel-action');
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Verify modal is closed
      const modalTitle = clusterSettings.getModalTitle();
      await expect(modalTitle).toBeHidden();
    });
  });
});
