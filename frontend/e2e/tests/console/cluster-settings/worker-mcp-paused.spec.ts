import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import { clusterVersionWithAvailableUpdates } from '../../../mocks/cluster-version';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';

test.describe(
  'Cluster Settings when worker MachineConfigPool is paused',
  { tag: ['@admin'] },
  () => {
    test('displays an alert', async ({ page, k8sClient }) => {
      const clusterSettings = new ClusterSettingsPage(page);

      await test.step('Setup: Pause worker MCP', async () => {
        try {
          await k8sClient.customObjectsApi.patchClusterCustomObject({
            group: 'machineconfiguration.openshift.io',
            version: 'v1',
            plural: 'machineconfigpools',
            name: 'worker',
            body: [
              {
                op: 'replace',
                path: '/spec/paused',
                value: true,
              },
            ],
          });
        } catch {
          test.skip(true, 'Worker MachineConfigPool not available on this cluster');
        }
      });

      try {
        await test.step('Setup: Mock cluster version with available updates', async () => {
          await page.route(CLUSTER_VERSION_URL, async (route) => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(clusterVersionWithAvailableUpdates),
            });
          });
        });

        await test.step('Navigate to Cluster Settings', async () => {
          await clusterSettings.navigateToDetails();
        });

        await test.step('Verify paused nodes alert is displayed', async () => {
          const pausedNodesAlert = page.getByTestId('cluster-settings-alerts-paused-nodes');
          await expect(pausedNodesAlert).toBeVisible();
        });

        await test.step('Verify pause button is displayed', async () => {
          const pauseButton = page.getByTestId('mcp-paused-button');
          await expect(pauseButton).toBeVisible();
        });
      } finally {
        await k8sClient.customObjectsApi.patchClusterCustomObject({
          group: 'machineconfiguration.openshift.io',
          version: 'v1',
          plural: 'machineconfigpools',
          name: 'worker',
          body: [
            {
              op: 'replace',
              path: '/spec/paused',
              value: false,
            },
          ],
        });
      }
    });
  },
);
