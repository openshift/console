import { test, expect } from '../../fixtures';
import { ensureDeveloperPerspective, warmupSPA } from '../../pages/base-page';
import { ClusterCustomizationPage } from '../../pages/dev-console/cluster-customization-page';

test.describe(
  'Cluster configuration customization',
  { tag: ['@dev-console', '@regression'] },
  () => {
    // These tests mutate cluster-wide Console configuration; serialize them so tracked restores cannot race.
    test.describe.configure({ mode: 'serial' });
    let customizationPage: ClusterCustomizationPage;
    let originalCustomization: { addPage?: unknown; developerCatalog?: unknown } | undefined;

    test.beforeEach(async ({ page, k8sClient }) => {
      await warmupSPA(page);
      await ensureDeveloperPerspective(page, k8sClient);
      const consoleConfig = (await k8sClient.getClusterCustomResource(
        'operator.openshift.io',
        'v1',
        'consoles',
        'cluster',
      )) as { spec?: { customization?: { addPage?: unknown; developerCatalog?: unknown } } };
      originalCustomization = {
        addPage: consoleConfig.spec?.customization?.addPage,
        developerCatalog: consoleConfig.spec?.customization?.developerCatalog,
      };
      customizationPage = new ClusterCustomizationPage(page);
      await customizationPage.navigateToCustomize();
      await expect(customizationPage.getHeading()).toBeVisible({ timeout: 30_000 });
    });

    test.afterEach(async ({ k8sClient }) => {
      if (!originalCustomization) return;
      await k8sClient.patchClusterCustomResource(
        'operator.openshift.io',
        'v1',
        'consoles',
        'cluster',
        {
          spec: {
            customization: {
              addPage: originalCustomization.addPage ?? null,
              developerCatalog: originalCustomization.developerCatalog ?? null,
            },
          },
        },
      );
      originalCustomization = undefined;
    });

    test('DC-01-TC01: Disable All services Add page action', async () => {
      await customizationPage.moveAvailableToChosen('add-page', 'All services');
      await customizationPage.waitForItemInList('add-page', 'All services', 'chosen');
      await expect(customizationPage.getFormSection('add-page')).toBeVisible();
    });

    test('DC-01-TC02: Disable specific sub-catalogs', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Builder Images');
      await customizationPage.waitForItemInList('catalog-types', 'Builder Images', 'chosen');
      await expect(customizationPage.getFormSection('catalog-types')).toBeVisible();
    });

    test('DC-01-TC03: Disable Add page items', async () => {
      await customizationPage.moveAvailableToChosen('add-page', 'Import from Git');
      await customizationPage.waitForItemInList('add-page', 'Import from Git', 'chosen');
      await expect(customizationPage.getFormSection('add-page')).toBeVisible();
    });

    test('DC-01-TC04: Re-enable catalogs after disabling', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Builder Images');
      await customizationPage.moveChosenToAvailable('catalog-types', 'Builder Images');
      await customizationPage.waitForItemInList('catalog-types', 'Builder Images', 'available');
      await expect(customizationPage.getFormSection('catalog-types')).toBeVisible();
    });

    test('DC-01-TC05: Verify console rollout after customization', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Builder Images');
      await customizationPage.waitForItemInList('catalog-types', 'Builder Images', 'chosen');
      await expect(customizationPage.getFormSection('catalog-types')).toBeVisible();
      await customizationPage.navigateToCustomize();
      await expect(customizationPage.getHeading()).toBeVisible({ timeout: 30_000 });
    });

    test('verifies perspectives section on General tab', async () => {
      await expect(customizationPage.getPerspectivesSection()).toBeVisible();
      await expect(customizationPage.getPerspectiveSectionItem('Developer')).toBeVisible();
    });

    test('verifies Developer tab shows pre-pinned navigation', async () => {
      await customizationPage.getTab('Developer').click();
      await expect(customizationPage.getPrePinnedSection()).toBeVisible({ timeout: 30_000 });
      await expect(customizationPage.getAvailableResources()).toBeVisible();
      await expect(customizationPage.getPinnedResources()).toBeVisible();
    });
  },
);
