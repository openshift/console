import { test, expect } from '../../fixtures';
import { HelmPage } from '../../pages/helm-page';

const HELM_CHART_NAME = 'Nodejs';

test.describe('Helm Catalog', { tag: ['@helm', '@regression'] }, () => {
  test('displays YAML view editor for Install Helm Chart page (HR-05-TC03)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-yaml-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and select chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
    });

    await test.step('Switch to YAML view and verify editor', async () => {
      await helmPage.getYamlViewRadio().click();
      await expect(helmPage.getYamlEditor()).toBeVisible({ timeout: 30_000 });

      const editorContent = await helmPage.getEditorContent();
      expect(editorContent.length).toBeGreaterThan(0);
    });

    await test.step('Cancel creation', async () => {
      await helmPage.getCancelButton().click();
    });
  });

  test('installs Helm Chart from catalog (HR-05-TC04)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-install-${Date.now()}`;
    const releaseName = 'nodejs-catalog';
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and install chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
      await helmPage.enterReleaseName(releaseName);
      await helmPage.clickInstallButton();
    });

    await test.step('Verify release exists in helm releases list', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await expect(helmPage.getTable()).toBeVisible({ timeout: 30_000 });
    });
  });

  test('selects all filters, clears all filters, and searches by name (HR-05-TC09, TC10, TC11)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-filter-${Date.now()}`;
    const releaseName = 'nodejs-filter';
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Install a helm release for filtering tests', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
      await helmPage.enterReleaseName(releaseName);
      await helmPage.clickInstallButton();
    });

    await test.step('Select all status filters (HR-05-TC09)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.filterByStatus('Deployed');
      await expect(
        helmPage.getFilterDropdownItem('deployed').locator('input'),
      ).toBeChecked();
    });

    await test.step('Clear all filters (HR-05-TC10)', async () => {
      const clearButton = helmPage.getClearAllFiltersButton();
      await expect(clearButton).toBeVisible({ timeout: 10_000 });
      await clearButton.click();
      await expect(helmPage.getTable()).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Search by name (HR-05-TC11)', async () => {
      await helmPage.searchByName(releaseName);
      await expect(
        helmPage
          .getTable()
          .getByTestId('data-view-cell-helm-release-name')
          .first(),
      ).toBeVisible({ timeout: 30_000 });

      await helmPage.searchByName('nonexistent-release-xyz');
      await expect(helmPage.getEmptyMessage()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('groups chart versions in software catalog (HR-04-TC01)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-versions-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Helm Charts catalog', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
    });

    await test.step('Select chart and verify version dropdown', async () => {
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
      await expect(helmPage.getFormTitle()).toHaveText('Create Helm Release');
      await expect(helmPage.getChartVersionDropdown()).toBeVisible();
    });

    await test.step('Cancel creation', async () => {
      await helmPage.getCancelButton().click();
    });
  });

  test('shows Helm Chart card on the +Add page (HR-06-TC01)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-add-page-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    await helmPage.goTo(`/add/ns/${ns}`);
    await expect(helmPage.getAddPageHelmCard()).toBeVisible({ timeout: 30_000 });
    await expect(helmPage.getAddPageHelmCard()).toContainText('Helm Chart');
  });

  test('shows chart versions dropdown for Quarkus chart (HR-06-TC05)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-quarkus-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and select Quarkus chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart('Quarkus');
      await helmPage.clickCreateOnSidePane();
    });

    await test.step('Verify chart versions dropdown', async () => {
      await expect(helmPage.getFormTitle()).toHaveText('Create Helm Release');
      await expect(helmPage.getChartVersionDropdown()).toBeVisible();
    });

    await test.step('Cancel creation', async () => {
      await helmPage.getCancelButton().click();
    });
  });

  test('shows non-configurable message for chart without values (HR-04-TC04)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const NON_CONFIGURABLE_CHART = 'Httpd Imagestreams';
    const ns = `aut-helm-noconfig-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to catalog and select non-configurable chart', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await page.getByPlaceholder('Filter by keyword...').fill(NON_CONFIGURABLE_CHART);
      const chartTile = page.getByTestId(`HelmChart-${NON_CONFIGURABLE_CHART}`).first();
      const noResults = page.getByText('No results found');
      // Wait for catalog to settle — either the chart tile appears or "No results found"
      await expect(chartTile.or(noResults)).toBeVisible({ timeout: 30_000 });
      test.skip(
        await noResults.isVisible(),
        `Chart "${NON_CONFIGURABLE_CHART}" not available on this cluster`,
      );
      await chartTile.click();
      await helmPage.clickCreateOnSidePane();
    });

    await test.step('Verify non-configurable message', async () => {
      await expect(helmPage.getNonConfigurableAlert()).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Cancel creation', async () => {
      await helmPage.getCancelButton().click();
    });
  });

  test('shows compatible helm charts in catalog (HR-02-TC01)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-compat-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Helm Charts catalog and verify charts visible', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await expect(helmPage.getChartTiles().first()).toBeVisible({ timeout: 30_000 });
      const count = await helmPage.getChartTiles().count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
