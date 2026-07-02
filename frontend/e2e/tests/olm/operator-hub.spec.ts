import { test, expect } from '../../fixtures';
import { CatalogPage } from '../../pages/catalog-page';

test.describe('Software Catalog Operator filtering', { tag: ['@admin'] }, () => {
  test('displays Operator catalog items with expected available Operators', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const catalogPage = new CatalogPage(page);
    const testNamespace = `test-operators-${Date.now()}`;

    await test.step('Create test namespace', async () => {
      await k8sClient.createNamespace(testNamespace);
      cleanup.trackNamespace(testNamespace);
    });

    await test.step('Navigate to Software Catalog and verify page', async () => {
      await catalogPage.navigateToSoftwareCatalog(testNamespace);
      await expect(catalogPage.getPageHeading()).toContainText('Software Catalog');
    });

    await test.step('Switch to Operators tab and verify tiles are present', async () => {
      await catalogPage.clickOperatorTab();
      await expect(async () => {
        const count = await catalogPage.getCatalogTiles().count();
        expect(count).toBeGreaterThan(0);
      }).toPass();
    });

    await test.step('Test Community filter functionality', async () => {
      // Enable Community filter
      await catalogPage.toggleSourceFilter('community');
      await expect(async () => {
        const count = await catalogPage.getCatalogTiles().count();
        expect(count).toBeGreaterThan(0);
      }).toPass();

      // Track which tile is first with Community filter
      const originalTileText = await catalogPage.getFirstCatalogTileTitle().textContent();

      // Disable Community filter
      await catalogPage.toggleSourceFilter('community');

      // Enable Certified filter
      await catalogPage.toggleSourceFilter('certified');
      await expect(async () => {
        const count = await catalogPage.getCatalogTiles().count();
        expect(count).toBeGreaterThan(0);
      }).toPass();

      // Verify the first tile title is different from Community filter
      await catalogPage.verifyTileTextChanged(originalTileText || '');
    });

    await test.step('Test operator name search functionality', async () => {
      const operatorName = 'Datadog Operator';

      // Clear the Certified source filter left by previous test
      await catalogPage.toggleSourceFilter('certified');

      await catalogPage.searchOperators(operatorName);
      await expect(async () => {
        const count = await catalogPage.getCatalogTiles().count();
        expect(count).toBeGreaterThan(0);
      }).toPass();
      await catalogPage.verifyTileContainsText(operatorName);

      // Clear the search
      await catalogPage.clearSearchFilter();
    });

    await test.step('Test empty search results and clear filters', async () => {
      // Enter search query that returns zero results
      await catalogPage.searchOperators('NoOperatorsTestXYZ123NonExistent');

      // Wait for search to complete and verify no tiles
      await expect(catalogPage.getCatalogTiles()).not.toBeAttached({ timeout: 10_000 });

      // Check if clear filters button appears
      const clearButton = catalogPage.getClearFiltersButton();
      if (await clearButton.count() > 0) {
        await expect(clearButton).toBeVisible();
        await catalogPage.clickClearAllFilters();
        await expect(catalogPage.getSearchInput()).toBeEmpty();
        await expect(async () => {
          const count = await catalogPage.getCatalogTiles().count();
          expect(count).toBeGreaterThan(0);
        }).toPass();
      } else {
        // If clear button doesn't appear, just clear the search manually
        await catalogPage.clearSearchFilter();
        await expect(async () => {
          const count = await catalogPage.getCatalogTiles().count();
          expect(count).toBeGreaterThan(0);
        }).toPass();
      }
    });

    await test.step('Test category filter functionality', async () => {
      await catalogPage.clickCategoryFilter('ai/machine learning');
      await expect(async () => {
        const count = await catalogPage.getCatalogTiles().count();
        expect(count).toBeGreaterThan(0);
      }).toPass();
    });
  });
});