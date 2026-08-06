import { test, expect } from '../../fixtures';
import { HelmUrlChartPage } from '../../pages/helm-url-chart-page';
import { ListPage } from '../../pages/list-page';

const NS_PREFIX = 'aut-helm-url';

test.describe('Install Helm Chart from URL', { tag: ['@helm'] }, () => {
  test('Navigate to URL chart install page from Helm tab: HR-URL-TC01', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `${NS_PREFIX}-tc01-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const listPage = new ListPage(page);
    const helmUrlChart = new HelmUrlChartPage(page);

    await test.step('Navigate to Helm page and click Create > Helm chart URL', async () => {
      await listPage.navigateToListPage(`/helm/ns/${ns}`);
      await listPage.clickCreateDropdownItem('Helm chart URL');
    });

    await test.step('Verify redirected to URL chart install page', async () => {
      await expect(page).toHaveURL(/\/url-chart/);
      await expect(helmUrlChart.getChartUrlInput()).toBeVisible();
    });
  });

  test('Validate required fields on URL chart form: HR-URL-TC02', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `${NS_PREFIX}-tc02-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmUrlChart = new HelmUrlChartPage(page);

    await test.step('Navigate to URL chart install page', async () => {
      await helmUrlChart.navigateToUrlChart(ns);
    });

    await test.step('Click Next without filling fields and verify validation errors', async () => {
      await helmUrlChart.clickNext();
      await expect(helmUrlChart.getValidationErrors().first()).toBeAttached();
    });
  });

  test('Validate invalid chart URL format: HR-URL-TC03', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `${NS_PREFIX}-tc03-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmUrlChart = new HelmUrlChartPage(page);

    await test.step('Navigate to URL chart install page', async () => {
      await helmUrlChart.navigateToUrlChart(ns);
    });

    await test.step('Enter invalid URL and fill other fields', async () => {
      await helmUrlChart.enterChartUrl('not-a-valid-url');
      await helmUrlChart.enterReleaseName('test-release');
      await helmUrlChart.enterChartVersion('1.0.0');
    });

    await test.step('Click Next and verify validation error for invalid URL format', async () => {
      await helmUrlChart.clickNext();
      await expect(helmUrlChart.getValidationErrors().first()).toBeAttached();
    });
  });

  test('Install Helm Chart from HTTP URL: HR-URL-TC04', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `${NS_PREFIX}-tc04-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmUrlChart = new HelmUrlChartPage(page);

    await test.step('Navigate to URL chart install page', async () => {
      await helmUrlChart.navigateToUrlChart(ns);
    });

    await test.step('Fill in HTTP chart URL, release name, and version', async () => {
      await helmUrlChart.enterChartUrl(
        'https://redhat-developer.github.io/redhat-helm-charts/charts/dotnet-0.0.1.tgz',
      );
      await helmUrlChart.enterReleaseName('dotnet-url-test');
      await helmUrlChart.enterChartVersion('0.0.1');
    });

    await test.step('Click Next to proceed to install step', async () => {
      await helmUrlChart.clickNext();
    });

    await test.step('Click Install and verify redirect to Topology', async () => {
      await helmUrlChart.clickInstall();
      await expect(page).toHaveURL(/\/topology\/ns\//, { timeout: 60_000 });
    });
  });

  test('Install Helm Chart from OCI registry: HR-URL-TC05', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `${NS_PREFIX}-tc05-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmUrlChart = new HelmUrlChartPage(page);

    await test.step('Navigate to URL chart install page', async () => {
      await helmUrlChart.navigateToUrlChart(ns);
    });

    await test.step('Fill in OCI chart URL, release name, and version', async () => {
      await helmUrlChart.enterChartUrl('oci://ghcr.io/stefanprodan/charts/podinfo');
      await helmUrlChart.enterReleaseName('podinfo-oci-test');
      await helmUrlChart.enterChartVersion('6.7.1');
    });

    await test.step('Click Next to proceed to install step', async () => {
      await helmUrlChart.clickNext();
    });

    await test.step('Click Install and verify redirect to Topology', async () => {
      await helmUrlChart.clickInstall();
      await expect(page).toHaveURL(/\/topology\/ns\//, { timeout: 60_000 });
    });
  });

  test('Upgrade a URL-installed Helm release: HR-URL-TC06', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `${NS_PREFIX}-tc06-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmUrlChart = new HelmUrlChartPage(page);
    const listPage = new ListPage(page);

    await test.step('Install a Helm chart via URL first', async () => {
      await helmUrlChart.navigateToUrlChart(ns);
      await helmUrlChart.enterChartUrl(
        'https://redhat-developer.github.io/redhat-helm-charts/charts/dotnet-0.0.1.tgz',
      );
      await helmUrlChart.enterReleaseName('dotnet-url-test');
      await helmUrlChart.enterChartVersion('0.0.1');
      await helmUrlChart.clickNext();
      await helmUrlChart.clickInstall();
      await expect(page).toHaveURL(/\/topology\/ns\//, { timeout: 60_000 });
    });

    await test.step('Navigate to Helm releases and find the release', async () => {
      await listPage.navigateToListPage(`/helm/ns/${ns}`);
      await listPage.waitForRows();
    });

    await test.step('Open kebab menu and select Upgrade', async () => {
      await listPage.clickKebabAction('dotnet-url-test', 'Upgrade');
    });

    await test.step('Click Install on the upgrade page and verify redirect', async () => {
      const submitButton = page.locator('[data-test-id="submit-button"]');
      await submitButton.click({ timeout: 30_000 });
      await expect(page).toHaveURL(/\/topology\/ns\//, { timeout: 60_000 });
    });
  });
});
