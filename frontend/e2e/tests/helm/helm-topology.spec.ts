import { test, expect } from '../../fixtures';
import { HelmDetailsPage } from '../../pages/helm-details-page';
import { HelmPage } from '../../pages/helm-page';
import { TopologyPage } from '../../pages/topology-page';
import { TopologySidebarPage } from '../../pages/topology-sidebar-page';

const HELM_CHART_NAME = 'Nodejs';

test.describe('Helm Topology', { tag: ['@helm', '@regression'] }, () => {
  test('verifies kebab and context menu actions (HR-01-TC01, TC02)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    test.setTimeout(300_000);
    const ns = `aut-helm-actions-${Date.now()}`;
    const releaseName = 'nodejs-actions';
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    const helmDetailsPage = new HelmDetailsPage(page);
    const topologyPage = new TopologyPage(page);

    await test.step('Install helm chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
      await helmPage.enterReleaseName(releaseName);
      await helmPage.clickInstallButton();
    });

    await test.step('Wait for release to be deployed', async () => {
      await helmPage.waitForHelmReleaseDeployed(ns, releaseName);
    });

    await test.step('Verify kebab menu options on Helm page (HR-01-TC02)', async () => {

      await helmPage.clickKebabMenu();
      await expect(helmDetailsPage.getActionMenuItem('Upgrade')).toBeVisible();
      await expect(helmDetailsPage.getActionMenuItem('Delete Helm Release')).toBeVisible();
      await page.keyboard.press('Escape');
    });

    await test.step('Verify context menu in topology (HR-01-TC01)', async () => {
      await helmPage.switchPerspective('Developer');
      await expect(async () => {
        await topologyPage.navigateToTopologyGraph(ns);
        await topologyPage.verifyWorkloadVisible(releaseName);
      }).toPass({ intervals: [5_000, 10_000], timeout: 60_000 });
      await topologyPage.rightClickOnGroup(releaseName);
      await expect(topologyPage.getContextMenuItem('Upgrade')).toBeVisible({ timeout: 10_000 });
      await expect(topologyPage.getContextMenuItem('Delete Helm Release')).toBeVisible();
      await page.keyboard.press('Escape');
    });

    await test.step('Switch back to Administrator perspective', async () => {
      await helmPage.switchPerspective('Administrator');
    });
  });

  test('verifies topology sidebar tabs and resource links (HR-07-TC01 to TC06)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    test.setTimeout(300_000);
    const ns = `aut-helm-sidebar-${Date.now()}`;
    const releaseName = 'nodejs-sidebar';
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    const topologyPage = new TopologyPage(page);
    const sidebarPage = new TopologySidebarPage(page);

    await test.step('Install helm chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
      await helmPage.enterReleaseName(releaseName);
      await helmPage.clickInstallButton();
    });

    await test.step('Wait for release to be deployed', async () => {
      await helmPage.waitForHelmReleaseDeployed(ns, releaseName);
    });

    await test.step('Switch to Developer perspective and open topology', async () => {
      await helmPage.switchPerspective('Developer');
      await expect(async () => {
        await topologyPage.navigateToTopologyGraph(ns);
        await topologyPage.verifyWorkloadVisible(releaseName);
      }).toPass({ intervals: [5_000, 10_000], timeout: 60_000 });
    });

    await test.step('Open sidebar and verify tabs (HR-07-TC01)', async () => {
      await topologyPage.clickOnNode(releaseName);
      await sidebarPage.verify();
      await expect(sidebarPage.getTab('Details')).toBeVisible();
      await expect(sidebarPage.getTab('Resources')).toBeVisible();
    });

    await test.step('Click Deployments link in Resources tab (HR-07-TC02)', async () => {
      await sidebarPage.clickTab('Resources');
      await sidebarPage.clickTypedResourceLink('/deployments/');
      await expect(page).toHaveURL(/\/deployments\//, { timeout: 30_000 });
    });

    await test.step('Navigate back and click Services link (HR-07-TC04)', async () => {
      await topologyPage.navigateToTopologyGraph(ns);
      await topologyPage.verifyWorkloadVisible(releaseName, 60_000);
      await topologyPage.clickOnNode(releaseName);
      await sidebarPage.verify();
      await sidebarPage.clickTab('Resources');
      await sidebarPage.clickTypedResourceLink('/services/');
      await expect(page).toHaveURL(/\/services\//, { timeout: 30_000 });
    });

    await test.step('Navigate back and click Routes link (HR-07-TC06)', async () => {
      await topologyPage.navigateToTopologyGraph(ns);
      await topologyPage.verifyWorkloadVisible(releaseName, 60_000);
      await topologyPage.clickOnNode(releaseName);
      await sidebarPage.verify();
      await sidebarPage.clickTab('Resources');
      await sidebarPage.clickTypedResourceLink('/routes/');
      await expect(page).toHaveURL(/\/routes\//, { timeout: 30_000 });
    });

    // HR-07-TC03 (BuildConfigs) and HR-07-TC05 (ImageStreams) are not tested because
    // the Nodejs helm chart uses Deployments, not DeploymentConfigs with S2I builds.
    // These resource types would require a different chart.

    await test.step('Switch back to Administrator perspective', async () => {
      await helmPage.switchPerspective('Administrator');
    });
  });
});
