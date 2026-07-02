import { test, expect } from '../../fixtures';
import { CatalogSourcePage } from '../../pages/catalog-source-page';

const managedCatalogSource = {
  name: 'redhat-operators',
  displayName: 'Red Hat Operators',
};

test.describe('CatalogSource details page', { tag: ['@admin'] }, () => {
  test('renders details about a managed catalog source', async ({ page }) => {
    const catalogSourcePage = new CatalogSourcePage(page);

    await test.step('Navigate to CatalogSource details', async () => {
      await catalogSourcePage.navigateToOperatorHubSources();
      await catalogSourcePage.openCatalogSourceDetails(managedCatalogSource.name);
    });

    await test.step('Verify section heading', async () => {
      await expect(catalogSourcePage.getSectionHeading('CatalogSource details')).toBeVisible();
    });

    await test.step('Verify Status is READY', async () => {
      await expect(catalogSourcePage.getDetailsValue('Status')).toHaveText('READY', {
        timeout: 300_000,
      });
    });

    await test.step('Verify Name field', async () => {
      await expect(catalogSourcePage.getDetailsLabel('Name')).toBeVisible();
      await expect(catalogSourcePage.getDetailsValue('Name')).toHaveText(
        managedCatalogSource.name,
      );
    });

    await test.step('Verify Status label is visible', async () => {
      await expect(catalogSourcePage.getDetailsLabel('Status')).toBeVisible();
    });

    await test.step('Verify Display name field', async () => {
      await expect(catalogSourcePage.getDetailsLabel('Display name')).toBeVisible();
      await expect(catalogSourcePage.getDetailsValue('Display name')).toHaveText(
        managedCatalogSource.displayName,
      );
    });

    await test.step('Verify Registry poll interval field', async () => {
      await expect(catalogSourcePage.getDetailsValue('Registry poll interval')).toBeVisible();
    });

    await test.step('Verify Number of Operators field', async () => {
      await expect(catalogSourcePage.getDetailsLabel('Number of Operators')).toBeVisible();
      await expect(catalogSourcePage.getDetailsValue('Number of Operators')).toBeVisible();
    });
  });

  test('lists package manifests under Operators tab', async ({ page }) => {
    const catalogSourcePage = new CatalogSourcePage(page);

    await test.step('Navigate to CatalogSource details', async () => {
      await catalogSourcePage.navigateToOperatorHubSources();
      await catalogSourcePage.openCatalogSourceDetails(managedCatalogSource.name);
      await expect(catalogSourcePage.getSectionHeading('CatalogSource details')).toBeVisible();
    });

    await test.step('Verify PackageManifest table on Operators tab', async () => {
      await catalogSourcePage.selectOperatorsTab();
      await expect(catalogSourcePage.getPackageManifestTable()).toBeAttached();
    });
  });

  test('allows modifying registry poll interval', async ({ page, k8sClient, cleanup }) => {
    const testNs = `test-catsrc-${Date.now()}`;
    const catalogSourceName = `test-catsrc-${Date.now()}`;
    const catalogSourcePage = new CatalogSourcePage(page);

    await test.step('Create test namespace and CatalogSource', async () => {
      await k8sClient.createNamespace(testNs);
      cleanup.trackNamespace(testNs);

      await k8sClient.createCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        testNs,
        'catalogsources',
        {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'CatalogSource',
          metadata: {
            name: catalogSourceName,
            namespace: testNs,
          },
          spec: {
            displayName: 'Test catalog',
            image: '',
            sourceType: 'grpc',
            updateStrategy: {
              registryPoll: {
                interval: '10m',
              },
            },
          },
        },
      );
      cleanup.trackCustomResource(
        catalogSourceName,
        testNs,
        'operators.coreos.com',
        'v1alpha1',
        'catalogsources',
      );
    });

    await test.step('Navigate to test CatalogSource details', async () => {
      await catalogSourcePage.navigateToOperatorHubSources();

      // Wait for the CatalogSource to appear in the UI after K8s creation
      await expect(page.getByTestId(catalogSourceName)).toBeVisible({ timeout: 60_000 });

      await catalogSourcePage.openCatalogSourceDetails(catalogSourceName);
    });

    await test.step('Edit registry poll interval to 30m', async () => {
      await catalogSourcePage.clickEditRegistryPollInterval();
      await expect(catalogSourcePage.getRegistryPollIntervalModalTitle()).toContainText(
        'Edit registry poll interval',
      );
      await catalogSourcePage.selectPollInterval('30m');
      await catalogSourcePage.submitPollIntervalModal();
    });

    await test.step('Verify registry poll interval updated', async () => {
      await expect(catalogSourcePage.getDetailsValue('Registry poll interval')).toHaveText('30m');
    });
  });
});
