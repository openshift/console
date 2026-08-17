import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';

export class CatalogPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading');
  private readonly filterInput: Locator = this.page.getByPlaceholder('Filter by keyword');
  private readonly searchCatalogInput = this.page.getByTestId('search-catalog').locator('input');
  private readonly operatorTab = this.page.getByTestId('tab operator');
  private readonly clearFiltersButton = this.page.getByTestId('catalog-clear-filters');

  async navigateToCatalog(namespace?: string): Promise<void> {
    const url = namespace ? `/catalog/ns/${namespace}` : '/catalog/all-namespaces';
    await this.goTo(url);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async navigateToAllNamespacesCatalog(): Promise<void> {
    await this.navigateToCatalog();
  }

  async navigateToTemplates(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}?catalogType=Template`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async navigateToSoftwareCatalog(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async navigateToOperatorCatalog(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}?catalogType=operator`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async navigateToPath(url: string): Promise<void> {
    await this.goTo(url);
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
    await this.robustClick(filterCheckbox);
  }

  async toggleSourceFilterByLabel(label: string): Promise<void> {
    await this.robustClick(this.page.getByRole('checkbox', { name: label }), {
      timeout: 60_000,
    });
  }

  getOperatorCard(operatorName: string): Locator {
    return this.page
      .getByTestId(`operator-${operatorName}`)
      .filter({ hasNotText: 'testing deprecation' });
  }

  async clickOperatorCard(operatorName: string): Promise<void> {
    await this.robustClick(this.getOperatorCard(operatorName), { timeout: 60_000 });
  }

  getDeprecatedWarningBadge(): Locator {
    return this.page.getByTestId('deprecated-operator-warning-badge');
  }

  getDeprecatedWarning(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async clickCategoryFilter(categoryId: string): Promise<void> {
    const categoryTab = this.page.getByTestId(`tab ${categoryId}`);
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

  catalogItem(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  catalogItemIcon(testId: string): Locator {
    return this.catalogItem(testId).locator('img.catalog-tile-pf-icon');
  }

  async selectTypeOption(typeName: string): Promise<void> {
    const typeFilter = this.page.getByTestId(`catalog-${typeName}`);
    if ((await typeFilter.count()) > 0) {
      await this.robustClick(typeFilter);
      return;
    }
    // data-test-group-item: legacy attr from CatalogServiceProvider (no React source to add data-test)
    const checkbox = this.page.locator(`[data-test-group-item="${typeName}"]`);
    if ((await checkbox.count()) > 0) {
      await this.robustClick(checkbox);
      return;
    }
    const link = this.page.getByRole('link', { name: typeName });
    await this.robustClick(link);
  }

  async selectTemplateCategory(category: string): Promise<void> {
    const categoryFilter = this.page.getByTestId(`category-${category}`);
    if ((await categoryFilter.count()) > 0) {
      await this.robustClick(categoryFilter);
      return;
    }
    const categoryLink = this.page.getByRole('link', { name: category, exact: true });
    await this.robustClick(categoryLink);
  }

  async searchAndSelectCard(cardName: string): Promise<void> {
    await this.filterInput.fill(cardName);
    const card = this.page.getByTestId(`catalog-tile-${cardName}`);
    // co-catalog-tile: Console's catalog tile class from CatalogTile.tsx
    const fallbackCard = this.page.locator('.co-catalog-tile').filter({ hasText: cardName });
    const anyResult = card.or(fallbackCard.first());
    await expect(anyResult).toBeVisible({ timeout: 10_000 });
    if ((await card.count()) > 0) {
      await this.robustClick(card);
      return;
    }
    await this.robustClick(fallbackCard.first());
  }

  async clickInstantiateTemplate(): Promise<void> {
    await this.robustClick(this.page.getByTestId('catalog-details-modal-cta'));
  }

  async clickCreateApplicationButton(): Promise<void> {
    await this.robustClick(this.page.getByRole('link', { name: /create application/i }));
  }

  getFilterInput(): Locator {
    return this.filterInput;
  }

  getHelpText(text: string): Locator {
    return this.page.getByText(text);
  }

  getFormSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create', exact: true });
  }

  getProjectSelectionMessage(): Locator {
    return this.page.getByText('Select a Project to view the software catalog');
  }

  async verifyTileContainsText(expectedText: string): Promise<void> {
    await expect(this.getFirstCatalogTileTitle()).toContainText(expectedText);
  }

  async verifyTileTextChanged(originalText: string): Promise<void> {
    await expect(this.getFirstCatalogTileTitle()).not.toHaveText(originalText);
  }
}
