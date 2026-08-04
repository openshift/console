import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';

test.describe('Install the Helm Release', { tag: ['@helm'] }, () => {
  test('Helm Chart option is visible on the +Add Page: HR-06-TC01', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-add-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Add page', async () => {
      await helmPage.switchPerspective('Developer');
      await page.goto(`/add/ns/${ns}`);
    });

    await test.step('Verify Helm Chart card is visible', async () => {
      const helmChartCard = page.getByTestId('item Helm Chart');
      await expect(helmChartCard).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Chart versions dropdown shows available versions: HR-06-TC05', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-versions-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and select Quarkus chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart('Quarkus');
    });

    await test.step('Open Create Helm Release form', async () => {
      await helmPage.clickCreateOnSidePane();
    });

    await test.step('Click chart versions dropdown and verify versions listed', async () => {
      const chartVersionDropdown = page.locator('#form-dropdown-chartVersion-field');
      // eslint-disable-next-line no-restricted-syntax
      await chartVersionDropdown.waitFor({ state: 'visible', timeout: 30_000 });
      await chartVersionDropdown.click();
      const items = page.getByTestId('console-select-item');
      await expect(items.first()).toBeVisible({ timeout: 10_000 });
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step('Cancel creation', async () => {
      await helmPage.getCancelButton().click();
    });
  });

  test('Namespace-scoped Helm Chart Repositories in the dev catalog: HR-06-TC12', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-ns-repo-${Date.now()}`;
    const ns2 = `aut-helm-ns-repo2-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    await k8sClient.createNamespace(ns2);
    cleanup.trackNamespace(ns);
    cleanup.trackNamespace(ns2);

    const helmPage = new HelmPage(page);

    await test.step('Create a namespace-scoped helm chart repository', async () => {
      await k8sClient.createCustomResource(
        'helm.openshift.io',
        'v1beta1',
        ns,
        'projecthelmchartrepositories',
        {
          apiVersion: 'helm.openshift.io/v1beta1',
          kind: 'ProjectHelmChartRepository',
          metadata: {
            name: 'ibm-repo',
            namespace: ns,
          },
          spec: {
            connectionConfig: {
              url: 'https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml',
            },
            name: 'Ibm Repo',
          },
        },
      );
    });

    await test.step('Verify repo is visible in the original namespace catalog', async () => {
      await helmPage.navigateToCatalogHelmCharts(ns);
      const chartRepoFilter = page.getByTestId('chartRepositoryTitle-Ibm Repo');
      await expect(chartRepoFilter).toBeVisible({ timeout: 60_000 });
    });

    await test.step('Verify repo is NOT visible in a different namespace', async () => {
      await helmPage.navigateToCatalogHelmCharts(ns2);
      const chartRepoFilter = page.getByTestId('chartRepositoryTitle-Ibm Repo');
      await expect(chartRepoFilter).not.toBeAttached({ timeout: 30_000 });
    });
  });

  test('Software Catalog Page when Helm Charts checkbox is selected: HR-06-TC02', async () => {
    test.skip(true, 'Manual test - requires multiple helm chart repositories pre-configured');
  });

  test('Install Helm Chart from Software Catalog Page using YAML View: HR-06-TC03', async () => {
    test.skip(true, 'Known broken test - form submit does not work correctly');
  });

  test('Certification filter in Helm Catalog Page: HR-06-TC08', async () => {
    test.skip(true, 'Requires providerType annotations in index.yaml - not yet implemented');
  });

  test('Applying Redhat Certification filter: HR-06-TC09', async () => {
    test.skip(true, 'Requires providerType annotations in index.yaml - not yet implemented');
  });

  test('Certified badge in Helm Catalog Page: HR-06-TC10', async () => {
    test.skip(true, 'Manual test - requires providerType annotations in repos');
  });

  test('Certified badge in Helm install side panel: HR-06-TC11', async () => {
    test.skip(true, 'Manual test - requires providerType annotations in repos');
  });

  test('Creating projecthelmchartrepository by non-admin user: HR-06-TC13', async () => {
    test.skip(true, 'Manual test - requires consoledeveloper login');
  });
});
