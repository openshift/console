import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';

export class CatalogPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading');
  private readonly filterInput: Locator = this.page.getByPlaceholder('Filter by keyword');

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

  async filterByKeyword(keyword: string): Promise<void> {
    await this.filterInput.fill(keyword);
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

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getFilterInput(): Locator {
    return this.filterInput;
  }

  getHelpText(text: string): Locator {
    return this.page.getByText(text);
  }

  getCatalogTiles(): Locator {
    // co-catalog-tile: Console's catalog tile class from CatalogTile.tsx
    return this.page.locator('.co-catalog-tile');
  }

  getFormSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create', exact: true });
  }

  getProjectSelectionMessage(): Locator {
    return this.page.getByText('Select a Project to view the software catalog');
  }
}
