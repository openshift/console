import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import { clusterVersionWithProgressing } from '../../../mocks/cluster-version';
import { stubWebSocketWatches } from './cluster-settings-test-utils';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';

test.describe('Cluster Settings while an update is in progress', { tag: ['@admin'] }, () => {
  test('displays information about the update', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    await stubWebSocketWatches(page, ['config.openshift.io/v1/clusterversions']);

    await page.route(CLUSTER_VERSION_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(clusterVersionWithProgressing),
      });
    });

    await test.step('Navigate to Cluster Settings', async () => {
      await clusterSettings.navigateToDetails();
    });

    await test.step('Verify update progress information is displayed', async () => {
      // Verify "Last completed version" header
      const currentVersionHeader = page.getByTestId('cv-current-version-header');
      await expect(currentVersionHeader).toContainText('Last completed version');

      // Verify current version
      const currentVersion = page.getByTestId('cv-current-version');
      await expect(currentVersion).toContainText('4.16.0');

      // Verify update status showing progress
      const updateStatus = page.getByTestId('cv-update-status-updating');
      await expect(updateStatus).toBeVisible();
      await expect(updateStatus).toContainText('Update to 4.16.2 in progress');

      // Verify progress indicator exists
      const updatesProgress = page.getByTestId('cv-updates-progress');
      await expect(updatesProgress).toBeVisible();

      // Verify updates group (3 items expected)
      const updatesGroup = page.getByTestId('cv-updates-group');
      await expect(updatesGroup).toHaveCount(3);

      // Verify Update button is hidden during update
      const updateButton = page.getByTestId('cv-update-button');
      await expect(updateButton).not.toBeAttached();
    });

    await test.step('Verify pause/resume update functionality', async () => {
      const pauseButton = page.getByTestId('mcp-paused-button');

      // Initially should show "Pause update"
      await expect(pauseButton).toBeVisible();
      await expect(pauseButton).toContainText('Pause update');

      // Click to pause
      await pauseButton.click();

      // Should now show "Resume update"
      await expect(pauseButton).toContainText('Resume update');

      // Click to resume
      await pauseButton.click();

      // Should be back to "Pause update"
      await expect(pauseButton).toContainText('Pause update');
    });
  });
});
