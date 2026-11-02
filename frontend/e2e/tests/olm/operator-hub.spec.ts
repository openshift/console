import { test, expect } from '../../fixtures';
import { CatalogPage } from '../../pages/catalog-page';
import { OLM_CLUSTER_STATE_LOCK } from '../../utils/locks';

// The OLMv0 catalog is its own type rather than a tab, so navigate straight to it. It is titled
// "Classic Operators" under Tech Preview and plain "Operators" everywhere else.
test.describe(
  'OLMv0 Operators catalog filtering',
  { tag: ['@admin'], lock: OLM_CLUSTER_STATE_LOCK },
  () => {
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

      await test.step('Navigate to the Operators catalog and verify page', async () => {
        await catalogPage.navigateToOperatorCatalog(testNamespace);
        await expect(catalogPage.getPageHeading()).toContainText('Operators');
      });

      await test.step('Verify tiles are present', async () => {
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

        // Capture the first tile text with Community filter for later comparison
        const originalTileText = await catalogPage.getFirstCatalogTileTitleText();

        // Validate that we captured a valid tile title
        expect(originalTileText).toBeTruthy();
        expect(originalTileText.trim()).not.toBe('');

        // Disable Community filter
        await catalogPage.toggleSourceFilter('community');

        // Enable Certified filter
        await catalogPage.toggleSourceFilter('certified');
        await expect(async () => {
          const count = await catalogPage.getCatalogTiles().count();
          expect(count).toBeGreaterThan(0);
        }).toPass();

        // Verify the first tile title is different from Community filter
        await catalogPage.verifyTileTextChanged(originalTileText);
      });

      await test.step('Test operator name search functionality', async () => {
        // Clear the Certified source filter left by previous test
        await catalogPage.toggleSourceFilter('certified');

        const operatorName = (await catalogPage.getFirstCatalogTileTitleText()).trim();
        expect(operatorName).not.toBe('');

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
        await expect(catalogPage.getCatalogTiles()).toHaveCount(0, { timeout: 10_000 });

        // Assert clear filters button is visible and click it
        const clearButton = catalogPage.getClearFiltersButton();
        await expect(clearButton).toBeVisible();
        await catalogPage.clickClearAllFilters();

        // Verify search input is empty and catalog tiles return
        await expect(catalogPage.getSearchInput()).toBeEmpty();
        await expect(async () => {
          const count = await catalogPage.getCatalogTiles().count();
          expect(count).toBeGreaterThan(0);
        }).toPass();
      });

      await test.step('Test category filter functionality', async () => {
        await catalogPage.clickCategoryFilter('ai/machine learning');
        await expect(async () => {
          const count = await catalogPage.getCatalogTiles().count();
          expect(count).toBeGreaterThan(0);
        }).toPass();
      });
    });
  },
);
