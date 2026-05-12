import { test, expect } from '../../../fixtures';
import { ClusterSettingsPage } from '../../../pages/cluster-settings-page';
import {
  clusterVersionWithAvailableUpdates,
  clusterVersionWithAvailableAndConditionalUpdates,
  clusterVersionWithConditionalUpdates,
} from '../../../mocks/cluster-version';
import {
  machineConfigPoolListWithPausedWorker,
  machineConfigPoolListWithUnpausedWorker,
} from '../../../mocks/machine-config-pool';

const CLUSTER_VERSION_URL = '**/apis/config.openshift.io/v1/clusterversions/version';
const CLUSTER_VERSION_WS_URL = /apis\/config\.openshift\.io\/v1\/clusterversions/;
const MCP_LIST_URL = '**/apis/machineconfiguration.openshift.io/v1/machineconfigpools?*';
const MCP_WS_URL = /machineconfiguration\.openshift\.io\/v1\/machineconfigpools/;

test.describe('Cluster Settings cluster update modal', { tag: ['@admin'] }, () => {
  test('changes based on the cluster', async ({ page }) => {
    const clusterSettings = new ClusterSettingsPage(page);

    // Intercept WebSocket watch connections to prevent real cluster data
    // from overriding the mocked HTTP responses
    await page.routeWebSocket(CLUSTER_VERSION_WS_URL, () => {});
    await page.routeWebSocket(MCP_WS_URL, () => {});

    await test.step('Scenario 1: With a paused Worker MCP', async () => {
      // Setup mocks
      await page.route(CLUSTER_VERSION_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clusterVersionWithAvailableUpdates),
        });
      });
      await page.route(MCP_LIST_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(machineConfigPoolListWithPausedWorker),
        });
      });

      await clusterSettings.navigateToDetails();

      // Open update modal and dropdown
      await clusterSettings.openUpdateModal();
      await clusterSettings.openUpdateDropdown();

      // Verify switch is disabled when worker is paused
      const updateSwitch = page
        .getByTestId('update-cluster-modal')
        .getByTestId('dropdown-with-switch-switch');
      await expect(updateSwitch).toBeVisible();
      await expect(updateSwitch).toBeDisabled();

      // Select version 4.17.1
      const version4171 = page
        .getByTestId('update-cluster-modal')
        .getByTestId('dropdown-with-switch-menu-item-4.17.1');
      await expect(version4171).toBeVisible();
      await version4171.click();

      // Verify paused nodes warning appears
      const pausedWarning = page.getByTestId('update-cluster-modal-paused-nodes-warning');
      await expect(pausedWarning).toBeVisible();

      // Verify partial update option appears
      const partialUpdateRadio = page.getByTestId('update-cluster-modal-partial-update-radio');
      await expect(partialUpdateRadio).toBeVisible();
      await partialUpdateRadio.click();

      // Verify worker checkbox is checked
      const workerCheckbox = page.getByTestId('pause-mcp-checkbox-worker');
      await expect(workerCheckbox).toBeVisible();
      await expect(workerCheckbox).toBeChecked();

      // Cancel the modal
      const cancelButton = page.getByTestId('modal-cancel-action');
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();
    });

    await test.step('Scenario 2: With available and conditional updates', async () => {
      // Update mocks
      await page.unroute(CLUSTER_VERSION_URL);
      await page.unroute(MCP_LIST_URL);

      await page.route(CLUSTER_VERSION_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clusterVersionWithAvailableAndConditionalUpdates),
        });
      });
      await page.route(MCP_LIST_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(machineConfigPoolListWithUnpausedWorker),
        });
      });

      await page.reload();
      await page.getByTestId('horizontal-link-Details').waitFor({ state: 'visible' });

      // Open update modal and dropdown
      await clusterSettings.openUpdateModal();
      await clusterSettings.openUpdateDropdown();

      // Select version 4.17.1 (should be recommended)
      const version4171 = page
        .getByTestId('update-cluster-modal')
        .getByTestId('dropdown-with-switch-menu-item-4.17.1');
      await expect(version4171).toBeVisible();
      await version4171.click();

      // Should not show not-recommended alert for 4.17.1
      const notRecommendedAlert = page.getByTestId('update-cluster-modal-not-recommended-alert');
      await expect(notRecommendedAlert).toBeHidden();

      // Cancel the modal
      const cancelButton = page.getByTestId('modal-cancel-action');
      await cancelButton.click();
    });

    await test.step('Scenario 3: With conditional updates only', async () => {
      // Update mocks
      await page.unroute(CLUSTER_VERSION_URL);

      await page.route(CLUSTER_VERSION_URL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(clusterVersionWithConditionalUpdates),
        });
      });

      await page.reload();
      await page.getByTestId('horizontal-link-Details').waitFor({ state: 'visible' });

      // Verify not-recommended alert on main page
      const mainPageAlert = page.getByTestId('cv-not-recommended-alert');
      await expect(mainPageAlert).toBeVisible();

      // Open update modal and dropdown
      await clusterSettings.openUpdateModal();
      await clusterSettings.openUpdateDropdown();

      // Enable conditional updates switch
      const updateSwitch = page
        .getByTestId('update-cluster-modal')
        .getByTestId('dropdown-with-switch-switch');
      await expect(updateSwitch).toBeVisible();
      await updateSwitch.click();

      // Verify 4.17.1 is not available (only conditional updates)
      const version4171 = page
        .getByTestId('update-cluster-modal')
        .getByTestId('dropdown-with-switch-menu-item-4.17.1');
      await expect(version4171).not.toBeAttached();

      // Verify 4.16.4 (conditional) is available
      const version4164 = page
        .getByTestId('update-cluster-modal')
        .getByTestId('dropdown-with-switch-menu-item-4.16.4');
      await expect(version4164).toBeVisible();
      await version4164.click();

      // Should show not-recommended alert for conditional update
      const notRecommendedAlert = page.getByTestId('update-cluster-modal-not-recommended-alert');
      await expect(notRecommendedAlert).toBeVisible();

      // Cancel the modal
      const cancelButton = page.getByTestId('modal-cancel-action');
      await cancelButton.click();
    });
  });
});
