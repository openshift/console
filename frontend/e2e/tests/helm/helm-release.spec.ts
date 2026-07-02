import { test, expect } from '../../fixtures';
import { HelmDetailsPage } from '../../pages/helm-details-page';
import { HelmPage } from '../../pages/helm-page';

const HELM_CHART_NAME = 'Nodejs';

test.describe('Helm Release', { tag: ['@helm', '@smoke'] }, () => {
  test('shows empty state when no helm releases exist (HR-05-TC01)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-empty-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    await helmPage.navigateToHelmReleases(ns);

    await expect(helmPage.getEmptyMessage()).toContainText('No Helm Releases found');
    await expect(helmPage.getInstallLink()).toBeVisible();
  });

  test('displays Create Helm Release page details (HR-05-TC02)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-form-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);

    await test.step('Navigate to Software Catalog and select Helm Charts', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
    });

    await test.step('Search and select Nodejs chart', async () => {
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
    });

    await test.step('Click Create on side pane', async () => {
      await helmPage.clickCreateOnSidePane();
    });

    await test.step('Verify Create Helm Release page', async () => {
      await expect(page.locator('[data-test="form-title"]')).toHaveText('Create Helm Release');
      await expect(helmPage.getReleaseNameInput()).toHaveValue('nodejs');
      await expect(helmPage.getFormViewRadio()).toBeChecked();
      await expect(helmPage.getYamlViewRadio()).not.toBeChecked();
      await expect(page.locator('#root_field-group').first()).toBeVisible();
    });

    await test.step('Cancel creation', async () => {
      await helmPage.getCancelButton().click();
    });
  });

  test('installs Helm Chart, verifies status and details, filters, and manages lifecycle', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-helm-lifecycle-${Date.now()}`;
    const releaseName = 'nodejs-release';
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);

    const helmPage = new HelmPage(page);
    const helmDetailsPage = new HelmDetailsPage(page);

    await test.step('Install Helm Chart from catalog (HR-06-TC04)', async () => {
      await helmPage.navigateToCatalog(ns);
      await helmPage.selectHelmChartsType();
      await helmPage.searchAndSelectChart(HELM_CHART_NAME);
      await helmPage.clickCreateOnSidePane();
      await helmPage.enterReleaseName(releaseName);
      await helmPage.clickInstallButton();
    });

    await test.step('Verify helm release is listed (HR-05-TC05)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await expect(helmPage.getTable()).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Verify status icons (HR-01-TC04)', async () => {
      await expect(helmPage.getStatusIcon().first()).toBeVisible({ timeout: 60_000 });
      await expect(helmPage.getStatusText().first()).toBeVisible();
    });

    await test.step('Filter by Deployed status (HR-05-TC06)', async () => {
      await helmPage.filterByStatus('Deployed');
      await expect(helmPage.getFilterDropdownItem('deployed').locator('input')).toBeChecked();
      await expect(
        helmPage
          .getTable()
          .locator('[data-test="data-view-cell-helm-release-name"]')
          .first(),
      ).toBeVisible();
    });

    await test.step('Verify details page tabs and actions (HR-05-TC13)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await helmPage.clickReleaseName(releaseName);

      await expect(helmDetailsPage.getSectionHeading()).toBeVisible({ timeout: 30_000 });
      await expect(helmDetailsPage.getResourcesTab()).toBeVisible();
      await expect(helmDetailsPage.getRevisionHistoryTab()).toBeVisible();
      await expect(helmDetailsPage.getReleaseNotesTab()).toBeVisible();

      await helmDetailsPage.clickActionsMenu();
      await expect(helmDetailsPage.getActionMenuItem('Upgrade')).toBeVisible();
      await expect(helmDetailsPage.getActionMenuItem('Delete Helm Release')).toBeVisible();
      await page.keyboard.press('Escape');
    });

    await test.step('Verify status on details page (HR-01-TC04)', async () => {
      await expect(helmDetailsPage.getPageHeading()).toContainText(releaseName);
      await expect(helmDetailsPage.getStatusIcon().first()).toBeVisible();
      await expect(
        helmDetailsPage.getStatusDetails().locator('[data-test="status-text"]'),
      ).toBeVisible();
    });

    await test.step('Verify revision history status (HR-01-TC04)', async () => {
      await helmDetailsPage.clickRevisionHistoryTab();
      await expect(helmDetailsPage.getStatusIcon().first()).toBeVisible();
    });

    await test.step('Upgrade helm release via kebab menu (HR-08-TC04)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await helmPage.clickKebabMenu();
      await helmPage.selectAction('Upgrade');

      await helmPage.upgradeChartVersion();
      await helmPage.clickUpgradeButton();
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await expect(helmPage.getTable()).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Verify kebab menu actions after upgrade (HR-08-TC01)', async () => {
      await helmPage.clickKebabMenu();
      const upgradeAction = page.locator('[data-test-action="Upgrade"]');
      await expect(upgradeAction).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('[data-test-action="Rollback"]')).toBeVisible();
      await expect(page.locator('[data-test-action="Delete Helm Release"]')).toBeVisible();
      await page.keyboard.press('Escape');
    });

    await test.step('Upgrade helm release again (HR-08-TC02)', async () => {
      await helmPage.clickKebabMenu();
      await helmPage.selectAction('Upgrade');
      await helmPage.upgradeChartVersion();
      await helmPage.clickUpgradeButton();
      await expect(page).toHaveURL(/\/helm\//, { timeout: 30_000 });
    });

    await test.step('Rollback helm release (HR-08-TC03)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await helmPage.clickReleaseName(releaseName);
      await helmDetailsPage.clickActionsMenu();
      await expect(helmDetailsPage.getActionMenuItem('Rollback')).toBeVisible();
      await helmDetailsPage.getActionMenuItem('Rollback').click();
      await helmPage.selectRevision();
      await helmPage.clickRollbackButton();
    });

    await test.step('Delete helm release (HR-01-TC03)', async () => {
      await helmPage.navigateToHelmReleases(ns);
      await helmPage.searchByName(releaseName);
      await helmPage.clickKebabMenu();
      await helmPage.selectAction('Delete Helm Release');
      await helmDetailsPage.enterReleaseNameInDeletePopup(releaseName);
      await helmDetailsPage.confirmDelete();
      await expect(page).toHaveURL(/\/helm\//, { timeout: 30_000 });
    });
  });
});
