import { test, expect } from '../../fixtures';
import { HelmReleasesPage } from '../../pages/helm-releases-page';
import { HelmDetailsPage } from '../../pages/helm-details-page';
import { SoftwareCatalogPage } from '../../pages/software-catalog-page';
import { HelmInstallPage } from '../../pages/helm-install-page';
import { TopologyPage } from '../../pages/topology-page';
import { TopologySidebarPage } from '../../pages/topology-sidebar-page';
import { HelmUpgradePage } from '../../pages/helm-upgrade-page';
import { HelmRollbackPage } from '../../pages/helm-rollback-page';
import { DeleteHelmReleaseModal } from '../../pages/delete-helm-release-modal';
// KubernetesClient is available via k8sClient fixture

/* eslint-disable playwright/expect-expect */
// Note: Assertions are in page object methods (verifyEmptyState, verifyTitle, etc.)
test.describe('Helm Release', { tag: ['@helm', '@smoke'] }, () => {
  test('Open the Helm tab when helm charts are absent: HR-05-TC01', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;

    await test.step('Create empty namespace', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);
    });

    await test.step('Navigate to Helm Release tab in new namespace', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab(namespace);
    });

    await test.step('Verify empty state message and catalog link', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.verifyEmptyState();
    });
  });

  test('Create Helm Release page details: HR-05-TC02', async ({ page, cleanup, k8sClient }) => {
    const namespace = `aut-helm-${Date.now()}`;

    await test.step('Create namespace', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);
    });

    await test.step('Navigate to Software Catalog', async () => {
      const catalogPage = new SoftwareCatalogPage(page);
      await catalogPage.navigateToCatalog(namespace);
      await catalogPage.verifyTitle();
    });

    await test.step('Select Helm Charts type', async () => {
      const catalogPage = new SoftwareCatalogPage(page);
      await catalogPage.selectHelmChartsType();
      await catalogPage.isCardsDisplayed();
    });

    await test.step('Search and select Nodejs chart', async () => {
      const catalogPage = new SoftwareCatalogPage(page);
      await catalogPage.searchAndSelectChart('Nodejs');
    });

    await test.step('Click Create button on sidebar', async () => {
      const catalogPage = new SoftwareCatalogPage(page);
      await catalogPage.clickButtonOnCatalogPageSidePane();
    });

    await test.step('Verify Create Helm Release page details', async () => {
      const installPage = new HelmInstallPage(page);
      await installPage.verifyPageDisplayed();
      await installPage.verifyDefaultReleaseName('nodejs');
      await installPage.verifyFormViewSelected();
      await installPage.verifyYamlViewEnabled();
    });
  });

  test('Install Helm Chart from Software Catalog using Form View: HR-06-TC04', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);
    });

    await test.step('Install Nodejs Helm chart', async () => {
      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Verify redirected to Topology page', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.verifyTopologyPage();
    });

    await test.step('Verify helm chart workload in Topology', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.verifyWorkloadInTopologyPage(releaseName);
    });
  });

  test('Helm release status verification: HR-01-TC04', async ({ page, cleanup, k8sClient }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Helm Release tab', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab();
      await helmPage.clickHelmReleasesTab();
    });

    await test.step('Verify helm release is visible in list', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.searchByName(releaseName);
      await helmPage.verifyHelmReleasesDisplayed();
    });

    await test.step('Verify status icon in helm releases table', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.verifyHelmChartStatus();
    });

    await test.step('Verify filter bar options', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.verifyFilterDropdownItems(
        'PendingInstall',
        'PendingUpgrade',
        'PendingRollback',
      );
    });

    await test.step('Click helm release name', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.clickHelmReleaseName(releaseName);
    });

    await test.step('Verify status in details page title and details tab', async () => {
      const detailsPage = new HelmDetailsPage(page);
      await detailsPage.verifyTitle();
      await detailsPage.verifyHelmReleaseStatus();
    });

    await test.step('Verify status in Revision history tab', async () => {
      const detailsPage = new HelmDetailsPage(page);
      await detailsPage.verifyRevisionHistoryStatus();
    });
  });

  test('Context menu options of helm release: HR-01-TC01', async ({ page, cleanup, k8sClient }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Topology page', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
    });

    await test.step('Right-click helm release to open context menu', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.rightClickWorkload(releaseName);
    });

    await test.step('Verify context menu actions', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.verifyContextMenu();
      await topologyPage.verifyContextMenuActions(['Upgrade', 'Delete Helm Release']);
    });
  });

  test('Open the Helm tab when helm charts are present: HR-05-TC05', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Helm Release tab', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab();
      await helmPage.clickHelmReleasesTab();
    });

    await test.step('Verify helm charts are listed', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.verifyHelmChartsListed();
    });
  });

  test('Filter out deployed Helm Charts: HR-05-TC06', async ({ page, cleanup, k8sClient }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Helm Release tab', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab();
      await helmPage.clickHelmReleasesTab();
    });

    await test.step('Select Deployed filter', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.selectDeployedFilter();
    });

    await test.step('Verify Deployed checkbox is checked', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.verifyDeployedFilterChecked();
    });

    await test.step('Verify only Deployed helm charts are listed', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.verifyHelmChartsListed();
    });
  });

  test('Helm release details page: HR-05-TC13', async ({ page, cleanup, k8sClient }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Helm Release tab and click release name', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab();
      await helmPage.clickHelmReleasesTab();
      await helmPage.clickHelmReleaseName(releaseName);
    });

    await test.step('Verify Details page opened', async () => {
      const detailsPage = new HelmDetailsPage(page);
      await detailsPage.verifyTitle();
    });

    await test.step('Verify all tabs are visible', async () => {
      const detailsPage = new HelmDetailsPage(page);
      await detailsPage.verifyAllTabs();
    });

    await test.step('Verify Actions dropdown menu', async () => {
      const detailsPage = new HelmDetailsPage(page);
      await detailsPage.verifyActionsDropdown();
    });

    await test.step('Verify Actions menu options', async () => {
      const detailsPage = new HelmDetailsPage(page);
      await detailsPage.clickActionsMenu();
      await detailsPage.verifyActionsInActionMenu();
    });
  });

  test('Perform Upgrade action on Helm Release through Context Menu: HR-08-TC04', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Topology and right-click helm release', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
      await topologyPage.rightClickWorkload(releaseName);
    });

    await test.step('Select Upgrade action from context menu', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.selectContextMenuAction('Upgrade');
    });

    await test.step('Upgrade chart version', async () => {
      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.selectDifferentChartVersion();
      await upgradePage.confirmChartVersionChange();
    });

    await test.step('Click Upgrade button', async () => {
      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.clickUpgrade();
    });

    await test.step('Verify redirected to Topology page', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.verifyTopologyPage();
    });
  });

  test('Actions menu on Helm page after helm chart upgrade: HR-08-TC01', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Upgrade helm chart', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
      await topologyPage.rightClickWorkload(releaseName);
      await topologyPage.selectContextMenuAction('Upgrade');

      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.selectDifferentChartVersion();
      await upgradePage.confirmChartVersionChange();
      await upgradePage.clickUpgrade();
    });

    await test.step('Navigate to Helm page', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab();
      await helmPage.searchByName(releaseName);
    });

    await test.step('Click Kebab menu', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.openKebabMenu();
    });

    await test.step('Verify Actions menu options', async () => {
      const sidebar = new TopologySidebarPage(page);
      await sidebar.verifyActions('Upgrade', 'Rollback', 'Delete Helm Release');
    });
  });

  test('Perform the helm chart upgrade for already upgraded helm chart: HR-08-TC02', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Upgrade helm chart (first time)', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
      await topologyPage.rightClickWorkload(releaseName);
      await topologyPage.selectContextMenuAction('Upgrade');

      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.selectDifferentChartVersion();
      await upgradePage.confirmChartVersionChange();
      await upgradePage.clickUpgrade();
    });

    await test.step('Navigate to Helm page and open Kebab menu', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.navigateToHelmTab();
      await helmPage.searchByName(releaseName);
      await helmPage.openKebabMenu();
    });

    await test.step('Click Upgrade action', async () => {
      const helmPage = new HelmReleasesPage(page);
      await helmPage.selectKebabAction('Upgrade');
    });

    await test.step('Upgrade chart version (second time)', async () => {
      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.selectDifferentChartVersion();
      await upgradePage.confirmChartVersionChange();
    });

    await test.step('Click Upgrade button', async () => {
      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.clickUpgrade();
    });

    await test.step('Verify redirected to Helm Releases page', async () => {
      await expect(page.locator('[data-test-id="helm-nav"]')).toBeVisible();
    });
  });

  test('Perform Rollback action on Helm Release through Context Menu: HR-08-TC03', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Upgrade helm chart to create a revision', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
      await topologyPage.rightClickWorkload(releaseName);
      await topologyPage.selectContextMenuAction('Upgrade');

      const upgradePage = new HelmUpgradePage(page);
      await upgradePage.selectDifferentChartVersion();
      await upgradePage.confirmChartVersionChange();
      await upgradePage.clickUpgrade();
    });

    await test.step('Navigate to Topology and open sidebar', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
      // Wait for the workload to be visible after upgrade
      await topologyPage.verifyWorkloadInTopologyPage(releaseName);
      // eslint-disable-next-line no-restricted-syntax
      await topologyPage.page.getByTestId('success-icon').waitFor({ state: 'visible', timeout: 20_000 });
      await topologyPage.clickWorkload(releaseName);
    });

    await test.step('Verify sidebar and click Actions dropdown', async () => {
      const sidebar = new TopologySidebarPage(page);
      await sidebar.verifySidebarOpen();
      await sidebar.clickActionsDropdown();
    });

    await test.step('Select Rollback action', async () => {
      const sidebar = new TopologySidebarPage(page);
      await sidebar.selectAction('Rollback');
    });

    await test.step('Select previous revision', async () => {
      const rollbackPage = new HelmRollbackPage(page);
      await rollbackPage.selectPreviousRevision();
    });

    await test.step('Click Rollback button', async () => {
      const rollbackPage = new HelmRollbackPage(page);
      await rollbackPage.clickRollback();
    });

    await test.step('Verify redirected to Topology page', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.verifyTopologyPage();
    });
  });

  test('Delete Helm Release through Context Menu: HR-01-TC03', async ({ page, cleanup, k8sClient }) => {
    const namespace = `aut-helm-${Date.now()}`;
    const releaseName = 'nodejs-release';

    await test.step('Create namespace and install Helm chart', async () => {
      await k8sClient.createNamespace(namespace);
      cleanup.trackNamespace(namespace);

      const installPage = new HelmInstallPage(page);
      await installPage.installHelmChartFromCatalog('Nodejs', releaseName, namespace);
    });

    await test.step('Navigate to Topology and right-click helm release', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.navigateToTopology(namespace);
      await topologyPage.rightClickWorkload(releaseName);
    });

    await test.step('Select Delete Helm Release action', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.selectContextMenuAction('Delete Helm Release');
    });

    await test.step('Enter release name in confirmation modal', async () => {
      const deleteModal = new DeleteHelmReleaseModal(page);
      await deleteModal.verifyModalOpen(releaseName);
      await deleteModal.enterReleaseName(releaseName);
    });

    await test.step('Click Delete button', async () => {
      const deleteModal = new DeleteHelmReleaseModal(page);
      await deleteModal.clickDelete();
    });

    await test.step('Verify redirected to Topology page', async () => {
      const topologyPage = new TopologyPage(page);
      await topologyPage.verifyTopologyPage();
    });

    await test.step('Verify helm release is removed from Topology', async () => {
      const workloadLocator = page
        .locator('[data-test="topology-node"]')
        .filter({ hasText: releaseName });
      await expect(workloadLocator).not.toBeAttached({ timeout: 30_000 });
    });
  });
});
