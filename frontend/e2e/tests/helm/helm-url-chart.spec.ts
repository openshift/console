import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';
import { HelmURLChartPage } from '../../pages/helm-url-chart-page';

test.describe('Helm URL Chart Install', { tag: ['@helm', '@regression'] }, () => {
  test('navigates to URL chart install page from Create dropdown (HR-URL-TC01)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-url-nav-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    const urlChartPage = new HelmURLChartPage(page);

    await test.step('Navigate to Helm page and open Create dropdown', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.clickCreateDropdown();
      await helmPage.selectCreateOption('helmChartInstallation');
    });

    await test.step('Verify URL chart install page', async () => {
      await expect(page).toHaveURL(/\/url-chart/);
      await expect(urlChartPage.getChartUrlField()).toBeVisible({ timeout: 30_000 });
      await expect(urlChartPage.getReleaseNameField()).toBeVisible();
      await expect(urlChartPage.getChartVersionField()).toBeVisible();
    });
  });

  test('validates required fields and invalid URL format (HR-URL-TC02, TC03)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-url-val-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const urlChartPage = new HelmURLChartPage(page);

    await urlChartPage.navigateToUrlChart(ns);

    await test.step('Validate required fields show errors on empty submit (HR-URL-TC02)', async () => {
      // Touch all fields to trigger validation
      await urlChartPage.fillChartUrl('');
      await urlChartPage.fillReleaseName('');
      await urlChartPage.fillChartVersion('');
      // Click the url field to trigger blur on version field
      await urlChartPage.getChartUrlField().click();

      await expect(urlChartPage.getSubmitButton()).toBeDisabled();
    });

    await test.step('Validate invalid URL format shows error (HR-URL-TC03)', async () => {
      await urlChartPage.fillChartUrl('invalid-url');
      await urlChartPage.fillReleaseName('test-release');
      await urlChartPage.fillChartVersion('1.0.0');
      // Trigger validation by blurring
      await urlChartPage.getReleaseNameField().click();

      await expect(urlChartPage.getUrlValidationError()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('installs from HTTP URL and upgrades (HR-URL-TC04, TC06)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    test.setTimeout(300_000);
    const ns = `aut-helm-url-http-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    const urlChartPage = new HelmURLChartPage(page);

    await test.step('Fill step 1 with HTTP URL (HR-URL-TC04)', async () => {
      await urlChartPage.navigateToUrlChart(ns);
      await urlChartPage.fillChartUrl(
        'https://redhat-developer.github.io/redhat-helm-charts/charts/dotnet-0.0.1.tgz',
      );

      // Verify auto-populated fields
      await expect(urlChartPage.getReleaseNameField()).toHaveValue('dotnet', {
        timeout: 10_000,
      });
      await expect(urlChartPage.getChartVersionField()).toHaveValue('0.0.1', {
        timeout: 10_000,
      });
    });

    await test.step('Click Next and verify step 2 disabled fields', async () => {
      await urlChartPage.clickNext();
      await expect(urlChartPage.getStep2ChartUrl()).toBeDisabled({
        timeout: 30_000,
      });
      await expect(urlChartPage.getStep2ReleaseName()).toBeDisabled();
      await expect(urlChartPage.getStep2ChartVersion()).toBeDisabled();
    });

    await test.step('Install the chart', async () => {
      await urlChartPage.clickInstall();
      await expect(page).toHaveURL(/\/helm\/|\/topology\//, { timeout: 60_000 });
    });

    await test.step('Wait for release to be deployed', async () => {
      await helmPage.waitForHelmReleaseDeployed(ns, 'dotnet');
    });

    await test.step('Upgrade URL-installed release (HR-URL-TC06)', async () => {
      await helmPage.clickKebabMenu();
      await helmPage.selectAction('Upgrade');
      await expect(helmPage.getFormTitle()).toBeVisible({ timeout: 30_000 });
      await helmPage.clickUpgradeButton();
      await expect(page).toHaveURL(/\/helm\//, { timeout: 30_000 });
    });
  });

  // OCI registry install depends on external registry availability
  test.fixme(
    'installs from OCI registry (HR-URL-TC05)',
    async ({ page, k8sClient, cleanup }) => {
      test.setTimeout(300_000);
      const ns = `aut-helm-url-oci-${Date.now()}`;
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);

      const helmPage = new HelmPage(page);
      const urlChartPage = new HelmURLChartPage(page);

      await test.step('Fill step 1 with OCI URL', async () => {
        await urlChartPage.navigateToUrlChart(ns);
        await urlChartPage.fillChartUrl('oci://ghcr.io/stefanprodan/charts/podinfo');
        await urlChartPage.fillChartVersion('6.7.1');

        await expect(urlChartPage.getReleaseNameField()).toHaveValue('podinfo', {
          timeout: 10_000,
        });
      });

      await test.step('Complete install', async () => {
        await urlChartPage.clickNext();
        await urlChartPage.clickInstall();
        await expect(page).toHaveURL(/\/helm\/|\/topology\//, { timeout: 60_000 });
      });

      await test.step('Verify release exists', async () => {
        await helmPage.navigateToHelmReleases(ns);
        await helmPage.searchByName('podinfo');
        await expect(helmPage.getTable()).toBeVisible({ timeout: 30_000 });
      });
    },
  );
});
