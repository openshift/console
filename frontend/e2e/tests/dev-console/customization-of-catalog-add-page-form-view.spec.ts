import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { CustomizationPage } from '../../pages/dev-console/customization-page';

test.describe(
  'Customization of catalogs and Add page through form view',
  { tag: ['@regression', '@dev-console'] },
  () => {
    const namespace = `aut-software-catalog-${Date.now()}`;
    let k8s: KubernetesClient;

    test.beforeAll(async () => {
      k8s = new KubernetesClient({
        clusterUrl: process.env.CLUSTER_URL || '',
        username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
        password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
      });
      await k8s.createNamespace(namespace);
    });

    test.afterAll(async () => {
      await k8s.deleteNamespace(namespace);
    });

    test('when all the sub-catalogs are disabled', async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const customizationPage = new CustomizationPage(page);

      await test.step('Navigate to console customization', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await customizationPage.navigateToConsoles();
        await customizationPage.clickCluster();
        await customizationPage.openCustomization();
      });

      await test.step('Disable all software catalog items', async () => {
        await customizationPage.clickDeveloperTab();
        await customizationPage.disableAllSoftwareCatalogItems();
      });

      await test.step('Verify save message', async () => {
        await customizationPage.expectSaveMessage();
      });

      await test.step('Verify software catalog not visible', async () => {
        await perspectivePage.switchToAdministrator();
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToAdd();
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByTestId('card developer-catalog')).toBeHidden();
      });
    });

    test('when specific sub-catalog is disabled', async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const customizationPage = new CustomizationPage(page);

      await test.step('Navigate to customization', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await customizationPage.navigateToConsoles();
        await customizationPage.clickCluster();
        await customizationPage.openCustomization();
      });

      await test.step('Disable Helm Charts in software catalog', async () => {
        await customizationPage.clickDeveloperTab();
        await customizationPage.disableSoftwareCatalogItem('Helm Charts');
      });

      await test.step('Verify save message', async () => {
        await customizationPage.expectSaveMessage();
      });

      await test.step('Verify Helm Charts not visible but catalog exists', async () => {
        await perspectivePage.switchToAdministrator();
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToAdd();
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByTestId('card developer-catalog')).toBeVisible({ timeout: 60_000 });
        await expect(page.getByTestId('item helm')).toBeHidden();
      });
    });

    test('when specific sub-catalog is enabled', async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const customizationPage = new CustomizationPage(page);

      await test.step('Navigate to customization', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await customizationPage.navigateToConsoles();
        await customizationPage.clickCluster();
        await customizationPage.openCustomization();
      });

      await test.step('Enable only Helm Charts', async () => {
        await customizationPage.clickDeveloperTab();
        await customizationPage.enableOnlySoftwareCatalogItem('Helm Charts');
      });

      await test.step('Verify save message', async () => {
        await customizationPage.expectSaveMessage();
      });

      await test.step('Verify only Helm Charts visible', async () => {
        await perspectivePage.switchToAdministrator();
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToAdd();
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByTestId('card developer-catalog')).toBeVisible({ timeout: 60_000 });
        await expect(page.getByTestId('item helm')).toBeVisible();
        await expect(page.getByTestId('item operator-backed')).toBeHidden();
      });
    });

    test('when all the add page items are disabled', async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const customizationPage = new CustomizationPage(page);

      await test.step('Navigate to customization', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await customizationPage.navigateToConsoles();
        await customizationPage.clickCluster();
        await customizationPage.openCustomization();
      });

      await test.step('Disable all add page items', async () => {
        await customizationPage.clickDeveloperTab();
        await customizationPage.disableAllAddPageItems();
      });

      await test.step('Verify save message', async () => {
        await customizationPage.expectSaveMessage();
      });

      await test.step('Verify add page only shows Getting Started', async () => {
        await perspectivePage.navigateToAdd();
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByTestId('getting-started')).toBeVisible({ timeout: 60_000 });
        const cards = page.getByTestId('add-page').locator('[data-test^=card]');
        await expect(cards).toHaveCount(2);
      });
    });

    test('when specific add page item is disabled', async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const customizationPage = new CustomizationPage(page);

      await test.step('Navigate to customization', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await customizationPage.navigateToConsoles();
        await customizationPage.clickCluster();
        await customizationPage.openCustomization();
      });

      await test.step('Disable Import from Git', async () => {
        await customizationPage.clickDeveloperTab();
        await customizationPage.disableAddPageItem('Import from Git');
      });

      await test.step('Verify save message', async () => {
        await customizationPage.expectSaveMessage();
      });

      await test.step('Verify Import from Git not visible', async () => {
        await perspectivePage.navigateToAdd();
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByTestId('card git-repository')).toBeHidden();
      });
    });
  },
);
