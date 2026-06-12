import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import {
  clusterVersionWithoutChannel,
  clusterVersionWithDesiredChannels,
} from '../../../mocks/cluster-version';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';

test.describe('Cluster Settings channel modal', { tag: ['@admin', '@smoke'] }, () => {
  test('changes based on cluster version', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    // Use a mutable reference so the single route handler can serve different
    // mock data across steps without unroute/route gaps that let real API
    // responses (including WebSocket watch updates) slip through.
    let activeMock = clusterVersionWithoutChannel;
    await page.route(CLUSTER_VERSION_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeMock),
      });
    });

    await test.step('Handle no channel configured scenario', async () => {
      await clusterSettings.navigateToDetails();

      await expect(clusterSettings.getCurrentChannelLink()).toContainText('Not configured');

      await clusterSettings.openChannelModal();

      await expect(clusterSettings.getModalTitle()).toContainText('Input channel');
      await expect(clusterSettings.getChannelModalInput()).toBeVisible();

      await clusterSettings.page.keyboard.press('Escape');
    });

    await test.step('Handle channel configured with available channels scenario', async () => {
      activeMock = clusterVersionWithDesiredChannels;

      await clusterSettings.navigateToDetails();

      await expect(clusterSettings.getCurrentChannelLink()).toContainText('stable-4.16');

      await clusterSettings.openChannelModal();

      await expect(clusterSettings.getModalTitle()).toContainText('Select channel');

      const dropdown = clusterSettings
        .getChannelModal()
        .locator('[data-test="console-select-menu-toggle"]');
      await expect(dropdown).toBeVisible();

      await clusterSettings.page.keyboard.press('Escape');
    });
  });
});
