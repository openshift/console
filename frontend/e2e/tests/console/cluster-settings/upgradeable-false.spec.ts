import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import { clusterVersionWithUpgradeableFalse } from '../../../mocks/cluster-version';
import { stubWebSocketWatches } from './cluster-settings-test-utils';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';

test.describe('Cluster Settings when ClusterVersion Upgradeable=False', { tag: ['@admin'] }, () => {
  test('displays alerts and badges for blocked updates', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    await stubWebSocketWatches(page, ['config.openshift.io/v1/clusterversions']);

    await page.route(CLUSTER_VERSION_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clusterVersionWithUpgradeableFalse),
      });
    });

    await test.step('Navigate to Cluster Settings', async () => {
      await clusterSettings.navigateToDetails();
    });

    await test.step('Verify not-upgradeable alert is displayed', async () => {
      const notUpgradeableAlert = page.getByTestId('cluster-settings-alerts-not-upgradeable');
      await expect(notUpgradeableAlert).toBeVisible();
    });

    await test.step('Open and verify "Other available paths" modal', async () => {
      const firstChannel = page.getByTestId('cv-channel').first();
      const moreUpdatesButton = firstChannel.getByTestId('cv-more-updates-button');

      // Click "More updates" button
      await expect(moreUpdatesButton).toBeVisible();
      await moreUpdatesButton.click();

      // Verify modal contains not-upgradeable alert
      const modal = page.getByTestId('more-updates-modal');
      await expect(modal).toBeVisible();

      const modalNotUpgradeableAlert = modal.getByTestId('cluster-settings-alerts-not-upgradeable');
      await expect(modalNotUpgradeableAlert).toBeVisible();

      // Verify modal contains blocked update badge
      const blockedBadge = modal.getByTestId('cv-update-blocked');
      await expect(blockedBadge).toBeVisible();

      // Close modal
      const closeButton = page.getByTestId('more-updates-modal-close-button');
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Verify modal is closed
      await expect(modal).toBeHidden();
    });

    await test.step('Verify blocked version badge in channel', async () => {
      const blockedVersionBadge = page.getByTestId('cv-channel-version-blocked');
      await expect(blockedVersionBadge).toBeVisible();
    });

    await test.step('Click blocked version dot and verify blocked info', async () => {
      const firstChannel = page.getByTestId('cv-channel').first();
      const blockedDot = firstChannel.getByTestId('cv-channel-version-dot-blocked');

      await expect(blockedDot).toBeVisible();
      await blockedDot.click();

      // Verify blocked info popover appears
      const blockedInfo = page.getByTestId('cv-update-blocked');
      await expect(blockedInfo).toBeVisible();

      const blockedDotInfo = page.getByTestId('cv-channel-version-dot-blocked-info');
      await expect(blockedDotInfo).toBeVisible();

      // Close the popover by pressing Escape
      await page.keyboard.press('Escape');
      await expect(blockedInfo).toBeHidden();
    });

    await test.step('Open update modal and verify blocked updates in dropdown', async () => {
      // Open update modal using page object method
      await clusterSettings.openUpdateModal();

      // Verify modal contains not-upgradeable alert
      const modal = page.getByTestId('update-cluster-modal');
      await expect(modal).toBeVisible();

      const modalNotUpgradeableAlert = modal.getByTestId('cluster-settings-alerts-not-upgradeable');
      await expect(modalNotUpgradeableAlert).toBeVisible();

      // Open dropdown
      const dropdownToggle = modal.getByTestId('dropdown-with-switch-toggle');
      await expect(dropdownToggle).toBeVisible();
      await dropdownToggle.click();

      // Verify 2 blocked update badges in dropdown (scoped to modal)
      const blockedBadges = modal.getByTestId('cv-update-blocked');
      await expect(blockedBadges).toHaveCount(2);
    });
  });
});
