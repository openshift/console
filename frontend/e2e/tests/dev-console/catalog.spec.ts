import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import {
  AddPage,
  SoftwareCatalogPage,
  TopologyPage,
} from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-catalog.feature
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-database.feature
 *   frontend/packages/dev-console/integration-tests/features/addFlow/catalog-all-namespaces.feature
 *   frontend/packages/dev-console/integration-tests/features/addFlow/software-catalog-details.feature
 *
 * Skipped scenarios:
 *   - A-09-TC07 (@manual) - Helm Charts Repositories
 *   - A-09-TC08 (@manual) - Software Catalog Customization - Add empty Categories
 *   - A-09-TC09 (@manual) - Software Catalog - Categories under Schema tab
 *   - A-09-TC10 (@manual) - Software Catalog Customization - Edit Categories
 *   - A-09-TC011 (@manual) - Devfiles on Software Catalog
 */

test.describe(
  'Create Application from Catalog',
  { tag: ['@dev-console', '@smoke'] },
  () => {
    const ns = `aut-addflow-catalog-${Date.now()}`;
    let addPage: AddPage;
    let catalogPage: SoftwareCatalogPage;
    let topologyPage: TopologyPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      catalogPage = new SoftwareCatalogPage(page);
      topologyPage = new TopologyPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await warmupSPA(page);
    });

    test('deploy application using Catalog Template - MariaDB [A-01-TC02]', async () => {
      test.slow();

      await test.step('Navigate to Templates in Software Catalog', async () => {
        await catalogPage.navigateToTemplates(ns);
      });

      await test.step('Select Databases category and MariaDB template', async () => {
        await catalogPage.selectTemplateCategory('Databases');
        await catalogPage.searchAndSelectCard('MariaDB');
      });

      await test.step('Instantiate template', async () => {
        await catalogPage.clickInstantiateTemplate();
        await catalogPage.getFormSubmitButton().click();
      });

      await test.step('Verify workload in topology', async () => {
        await topologyPage.waitForWorkload('mariadb');
      });
    });
  },
);

test.describe(
  'Create Database from Add page',
  { tag: ['@dev-console', '@smoke'] },
  () => {
    const ns = `aut-addflow-database-${Date.now()}`;
    let addPage: AddPage;
    let catalogPage: SoftwareCatalogPage;
    let topologyPage: TopologyPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      catalogPage = new SoftwareCatalogPage(page);
      topologyPage = new TopologyPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('create Database from Add page - MariaDB [A-03-TC01]', async () => {
      test.slow();

      await test.step('Click Database card', async () => {
        await addPage.clickDatabaseCard();
      });

      await test.step('Select MariaDB and instantiate', async () => {
        await catalogPage.searchAndSelectCard('MariaDB');
        await catalogPage.clickInstantiateTemplate();
        await catalogPage.getFormSubmitButton().click();
      });

      await test.step('Verify workload in topology', async () => {
        await topologyPage.waitForWorkload('mariadb');
      });
    });
  },
);

test.describe(
  'Software Catalog with All Namespaces',
  { tag: ['@dev-console', '@regression'] },
  () => {
    let catalogPage: SoftwareCatalogPage;

    test.beforeEach(async ({ page }) => {
      catalogPage = new SoftwareCatalogPage(page);
      await warmupSPA(page);
    });

    test('forces project selection when all namespaces URL is accessed [A-12-TC01]', async () => {
      await test.step('Navigate to catalog all namespaces', async () => {
        await catalogPage.navigateToAllNamespacesCatalog();
      });

      await test.step('Verify project selection message', async () => {
        await expect(catalogPage.getPageHeading()).toBeVisible();
        await expect(catalogPage.getProjectSelectionMessage()).toBeVisible();
      });
    });

    test('shows catalog items when specific project is selected [A-12-TC02]', async ({
      k8sClient,
      cleanup,
    }) => {
      const ns = `aut-catalog-namespaces-${Date.now()}`;
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);

      await test.step('Navigate to catalog with namespace', async () => {
        await catalogPage.navigateToCatalog(ns);
      });

      await test.step('Verify catalog items are visible', async () => {
        await expect(catalogPage.getPageHeading()).toBeVisible();
        const tiles = catalogPage.getCatalogTiles();
        await expect(tiles.first()).toBeVisible({ timeout: 30_000 });
      });
    });
  },
);

test.describe(
  'Software Catalog Page details',
  { tag: ['@dev-console', '@regression'] },
  () => {
    const ns = `aut-catalog-pagedetails-${Date.now()}`;
    let catalogPage: SoftwareCatalogPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      catalogPage = new SoftwareCatalogPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await warmupSPA(page);
      await catalogPage.navigateToCatalog(ns);
    });

    test('Software Catalog page default view [A-09-TC01]', async () => {
      await expect(catalogPage.getFilterInput()).toBeVisible();
    });

    test('Helm Charts on Software Catalog [A-09-TC06]', async () => {
      await test.step('Click on Helm Charts type', async () => {
        await catalogPage.selectTypeOption('Helm Charts');
      });

      await test.step('Verify Helm Charts are displayed', async () => {
        const tiles = catalogPage.getCatalogTiles();
        await expect(tiles.first()).toBeVisible({ timeout: 30_000 });
        await expect(catalogPage.getFilterInput()).toBeVisible();
      });
    });
  },
);
