import { type Locator, expect } from '@playwright/test';

import BasePage from './base-page';

export class CatalogPage extends BasePage {
  private readonly filterInput: Locator = this.page.getByPlaceholder('Filter by keyword');
  private readonly searchCatalogInput = this.page.getByTestId('search-catalog').locator('input');
  private readonly operatorTab = this.page.getByTestId('tab operator');
  private readonly clearFiltersButton = this.page.getByTestId('catalog-clear-filters');
  private readonly pageHeading = this.page.getByTestId('page-heading');

  async navigateToCatalog(): Promise<void> {
    await this.goTo('/catalog/all-namespaces');
    await expect(this.filterInput).toBeVisible({ timeout: 60_000 });
  }

  async navigateToSoftwareCatalog(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}`);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async filterByKeyword(keyword: string): Promise<void> {
    await this.filterInput.fill(keyword);
  }

  async searchOperators(operatorName: string): Promise<void> {
    await this.searchCatalogInput.fill(operatorName);
  }

  async clearSearchFilter(): Promise<void> {
    await this.searchCatalogInput.fill('');
  }

  async clickOperatorTab(): Promise<void> {
    await this.robustClick(this.operatorTab);
  }

  async clickClearAllFilters(): Promise<void> {
    await this.robustClick(this.clearFiltersButton);
  }

  async toggleSourceFilter(filterType: string): Promise<void> {
    const filterCheckbox = this.page.getByTestId(`source-${filterType}`);
    await filterCheckbox.click();
  }

  async clickCategoryFilter(categoryId: string): Promise<void> {
    const categoryTab = this.page.locator(`[data-test="tab ${categoryId}"] > a`);
    await this.robustClick(categoryTab);
  }

  getCatalogTiles(): Locator {
    return this.page.locator('.co-catalog-tile');
  }

  getFirstCatalogTile(): Locator {
    return this.getCatalogTiles().first();
  }

  getFirstCatalogTileTitle(): Locator {
    return this.getFirstCatalogTile().locator('.catalog-tile-pf-title');
  }

  async getFirstCatalogTileTitleText(): Promise<string> {
    return this.getFirstCatalogTileTitle().innerText();
  }

  getClearFiltersButton(): Locator {
    return this.clearFiltersButton;
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getSearchInput(): Locator {
    return this.searchCatalogInput;
  }

  getSearchInputElement(): Locator {
    return this.searchCatalogInput;
  }

  catalogItem(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  catalogItemIcon(testId: string): Locator {
    return this.catalogItem(testId).locator('img.catalog-tile-pf-icon');
  }

  /**
   * Verify that catalog tiles contain expected title text
   */
  async verifyTileContainsText(expectedText: string): Promise<void> {
    await expect(this.getFirstCatalogTileTitle()).toHaveText(expectedText);
  }

  /**
   * Verify that first tile title has changed from original text
   */
  async verifyTileTextChanged(originalText: string): Promise<void> {
    await expect(this.getFirstCatalogTileTitle()).not.toHaveText(originalText);
  }
}
