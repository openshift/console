import { test, expect } from '../../fixtures';
import { ensureDeveloperPerspective, warmupSPA } from '../../pages/base-page';
import { ClusterCustomizationPage } from '../../pages/dev-console/cluster-customization-page';

test.describe(
  'Cluster configuration customization',
  { tag: ['@dev-console', '@regression'] },
  () => {
    let customizationPage: ClusterCustomizationPage;

    test.beforeEach(async ({ page, k8sClient }) => {
      await warmupSPA(page);
      await ensureDeveloperPerspective(page, k8sClient);
      customizationPage = new ClusterCustomizationPage(page);
      await customizationPage.navigateToCustomize();
      await expect(customizationPage.getHeading()).toBeVisible({ timeout: 30_000 });
    });

    test('DC-01-TC01: Disable Developer catalog', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Developer Catalog');
      await expect(customizationPage.getSuccessAlert()).toBeVisible({ timeout: 30_000 });
      await customizationPage.moveChosenToAvailable('catalog-types', 'Developer Catalog');
    });

    test('DC-01-TC02: Disable specific sub-catalogs', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Builder Images');
      await expect(customizationPage.getSuccessAlert()).toBeVisible({ timeout: 30_000 });
      await customizationPage.moveChosenToAvailable('catalog-types', 'Builder Images');
    });

    test('DC-01-TC03: Disable Add page items', async () => {
      await customizationPage.moveAvailableToChosen('add-page', 'Import from Git');
      await expect(customizationPage.getSuccessAlert()).toBeVisible({ timeout: 30_000 });
      await customizationPage.moveChosenToAvailable('add-page', 'Import from Git');
    });

    test('DC-01-TC04: Re-enable catalogs after disabling', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Builder Images');
      await customizationPage.moveChosenToAvailable('catalog-types', 'Builder Images');
      await expect(customizationPage.getSuccessAlert()).toBeVisible({ timeout: 30_000 });
    });

    test('DC-01-TC05: Verify console rollout after customization', async () => {
      await customizationPage.moveAvailableToChosen('catalog-types', 'Builder Images');
      await expect(customizationPage.getSuccessAlert()).toBeVisible({ timeout: 30_000 });
      await customizationPage.moveChosenToAvailable('catalog-types', 'Builder Images');
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
