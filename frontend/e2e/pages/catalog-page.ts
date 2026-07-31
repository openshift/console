import { type Locator, expect } from '@playwright/test';

import BasePage from './base-page';

export class CatalogPage extends BasePage {
  private readonly filterInput: Locator = this.page.getByPlaceholder('Filter by keyword');

  async navigateToCatalog(): Promise<void> {
    await this.goTo('/catalog/all-namespaces');
    await expect(this.filterInput).toBeVisible({ timeout: 60_000 });
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
}
