import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';
import { TopologyPage } from '../../pages/topology-page';

test.describe('Helm Chart Navigation', { tag: ['@helm'] }, () => {
  test('HR-05-TC03: YAML view editor for Install Helm Chart page', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const ns = `aut-helm-tc03-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Helm Chart catalog and open Nodejs chart', async () => {
      await helmPage.navigateToCatalogHelmCharts(ns);
      await helmPage.searchAndSelectHelmChart('Nodejs');
    });

    await test.step('Switch to YAML view and verify editor is visible', async () => {
      await helmPage.selectYamlView();
      await expect(helmPage.getYamlEditorLines()).toBeVisible();
    });
  });

  test('HR-05-TC04: Install Helm Chart', async ({ page, cleanup, k8sClient }) => {
    const ns = `aut-helm-tc04-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    const topologyPage = new TopologyPage(page);

    await test.step('Navigate to Helm Chart catalog and open Nodejs chart', async () => {
      await helmPage.navigateToCatalogHelmCharts(ns);
      await helmPage.searchAndSelectHelmChart('Nodejs');
    });

    await test.step('Install the Helm Chart with default release name', async () => {
      await helmPage.clickCreate();
    });

    await test.step('Verify Helm Chart workload appears in Topology', async () => {
      await topologyPage.verifyWorkloadVisible('nodejs', 60_000);
    });
  });

  test('HR-05-TC09: Select all filters', async ({ page, cleanup, k8sClient }) => {
    const ns = `aut-helm-tc09-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Helm releases page', async () => {
      await helmPage.navigateToHelmReleases(ns);
    });

    await test.step('Open status filter and select all checkboxes', async () => {
      await helmPage.openStatusFilterDropdown();
      await helmPage.selectAllStatusFilters();
    });

    await test.step('Verify all filter checkboxes are checked', async () => {
      await helmPage.verifyAllStatusFiltersChecked();
    });
  });

  test('HR-05-TC10: Clear all filters', async ({ page, cleanup, k8sClient }) => {
    const ns = `aut-helm-tc10-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Helm releases page', async () => {
      await helmPage.navigateToHelmReleases(ns);
    });

    await test.step('Select all status filters', async () => {
      await helmPage.openStatusFilterDropdown();
      await helmPage.selectAllStatusFilters();
    });

    await test.step('Clear all filters and verify they are removed', async () => {
      await helmPage.clearAllFilters();
      await helmPage.openStatusFilterDropdown();
      await helmPage.verifyAllStatusFiltersUnchecked();
    });
  });

  test('HR-05-TC11: Search for the Helm Chart', async ({ page, cleanup, k8sClient }) => {
    const ns = `aut-helm-tc11-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Install a Helm Chart to have searchable data', async () => {
      await helmPage.navigateToCatalogHelmCharts(ns);
      await helmPage.searchAndSelectHelmChart('Nodejs');
      await helmPage.clickCreate();
      // Wait for redirect to topology to confirm installation completed
      await expect(page).toHaveURL(/topology/, { timeout: 60_000 });
    });

    await test.step('Navigate to Helm releases and search for the chart', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName('nodejs');
      await expect(helmPage.getReleaseCellByName('nodejs')).toBeVisible();
    });
  });

  test('HR-05-TC07: Filter out failed Helm Charts', async () => {
    test.skip(true, 'Manual test - requires a Helm release in Failed state');
  });

  test('HR-05-TC08: Filter out other Helm Charts', async () => {
    test.skip(true, 'Manual test - requires a Helm release in Other state');
  });
});
