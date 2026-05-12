import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import {
  clusterVersionWithoutChannel,
  clusterVersionWithDesiredChannels,
} from '../../../mocks/cluster-version';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';
const CLUSTER_VERSION_WS_URL = /apis\/config\.openshift\.io\/v1\/clusterversions/;

test.describe('Cluster Settings channel modal', { tag: ['@admin', '@smoke'] }, () => {
  test('changes based on cluster version', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    // Intercept WebSocket watch connections to prevent real cluster data
    // from overriding the mocked HTTP responses
    await page.routeWebSocket(CLUSTER_VERSION_WS_URL, () => {});

    await test.step('Handle no channel configured scenario', async () => {
      // Mock the API response to return cluster version without channel
      await page.route(CLUSTER_VERSION_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clusterVersionWithoutChannel),
        });
      });

      // Navigate to cluster settings (dismisses tour and triggers the mocked response)
      await clusterSettings.navigateToDetails();

      // Verify current channel shows "Not configured"
      await expect(clusterSettings.getCurrentChannelLink()).toContainText('Not configured');

      // Open the modal
      await clusterSettings.openChannelModal();

      // Verify modal title is "Input channel" (the key test - modal adapts to state)
      await expect(clusterSettings.getModalTitle()).toContainText('Input channel');

      // Verify the input field is present (not a dropdown)
      await expect(clusterSettings.getChannelModalInput()).toBeVisible();

      // Close modal without submitting (this is a UI state test, not an integration test)
      await clusterSettings.page.keyboard.press('Escape');
    });

    await test.step('Handle channel configured with available channels scenario', async () => {
      // Clear previous route and set new mock
      await page.unroute(CLUSTER_VERSION_URL);
      await page.route(CLUSTER_VERSION_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clusterVersionWithDesiredChannels),
        });
      });

      // Navigate to cluster settings to trigger the mocked response
      await clusterSettings.navigateToDetails();

      // Verify current channel shows "stable-4.16"
      await expect(clusterSettings.getCurrentChannelLink()).toContainText('stable-4.16');

      // Open the modal
      await clusterSettings.openChannelModal();

      // Verify modal title is "Select channel" (the key test - modal adapts to state)
      await expect(clusterSettings.getModalTitle()).toContainText('Select channel');

      // Verify the dropdown is present (not an input field)
      const dropdown = clusterSettings
        .getChannelModal()
        .locator('[data-test="console-select-menu-toggle"]');
      await expect(dropdown).toBeVisible();

      // Close modal without submitting (this is a UI state test, not an integration test)
      await clusterSettings.page.keyboard.press('Escape');
    });
  });
});
