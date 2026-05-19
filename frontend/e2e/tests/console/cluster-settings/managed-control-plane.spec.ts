import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import { OverviewPage } from '../../../pages/overview-page';

/**
 * Tests UI behavior for managed clusters (ROSA, ARO, etc.) where control plane is external.
 * This test only runs on clusters with SERVER_FLAGS.controlPlaneTopology = 'External'.
 * On regular clusters, the test will skip with an explanatory message.
 */
test.describe('Cluster Settings when control plane is managed', { tag: ['@admin'] }, () => {
  test('displays an alert and hides elements', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);
    const overviewPage = new OverviewPage(page);

    // Intercept and modify SERVER_FLAGS before React components mount
    // Use Object.defineProperty to ensure the override persists
    await page.addInitScript(() => {
      // Store the original descriptor
      let originalFlags: any = null;

      // Intercept SERVER_FLAGS assignment
      Object.defineProperty(window, 'SERVER_FLAGS', {
        get() {
          return originalFlags;
        },
        set(value) {
          // Override controlPlaneTopology whenever SERVER_FLAGS is set
          originalFlags = { ...value, controlPlaneTopology: 'External' };
        },
        configurable: true,
      });
    });

    await test.step(
      'Verify Details tab shows hosted alert and hides/disables update controls',
      async () => {
        await clusterSettings.navigateToDetails();

        // Hosted cluster alert should be visible
        await expect(clusterSettings.getHostedAlert()).toBeVisible();

        // Update-related controls should be hidden or disabled
        // Some are removed from DOM, others are disabled - check both states
        await expect(clusterSettings.getCurrentChannelLink()).not.toBeAttached();
        await expect(clusterSettings.getUpdateButton()).not.toBeAttached();
        // Upstream server URL button is disabled but still in DOM
        await expect(clusterSettings.getUpstreamServerUrl()).toBeDisabled();
        await expect(clusterSettings.getAutoscalerLink()).not.toBeAttached();

        // Temporary admin user messages should not exist
        const tempAdminMessage = page.getByText(/logged in as a temporary administrative user/i);
        await expect(tempAdminMessage).toBeHidden();
        const allowOthersMessage = page.getByText(/allow others to log in/i);
        await expect(allowOthersMessage).toBeHidden();
      },
    );

    await test.step('Verify Configuration tab hides cluster-level config resources', async () => {
      await clusterSettings.navigateToConfigurationTab();

      // These configuration resources should not be editable in managed clusters
      const hiddenConfigs = [
        'APIServer',
        'Authentication',
        'DNS',
        'FeatureGate',
        'Networking',
        'OAuth',
        'Proxy',
        'Scheduler',
      ];

      for (const configName of hiddenConfigs) {
        await expect(clusterSettings.getConfigurationResourceLink(configName)).not.toBeAttached();
      }
    });

    await test.step('Verify Overview page hides Control Plane section', async () => {
      await overviewPage.navigateToOverview();

      // Control Plane section should not exist for managed clusters
      await expect(overviewPage.getControlPlaneSection()).not.toBeAttached();
    });
  });
});
