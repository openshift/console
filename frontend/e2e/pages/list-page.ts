import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ListPage extends BasePage {
  private readonly pageHeading = this.page.locator('[data-test="page-heading"]');
  private readonly nameFilterInput = this.page.getByTestId('name-filter-input');

  constructor(page: Page) {
    super(page);
  }

  async titleShouldHaveText(title: string): Promise<void> {
    await expect(this.pageHeading).toHaveText(title);
  }

  async filterByName(name: string): Promise<void> {
    await this.nameFilterInput.fill(name);
  }

  resourceRow(name: string): Locator {
    return this.page.locator(`[data-test-rows="resource-row"]`, { hasText: name });
  }

  async rowShouldExist(name: string): Promise<void> {
    await expect(this.resourceRow(name)).toBeAttached();
  }

  async rowShouldNotExist(name: string): Promise<void> {
    await expect(this.resourceRow(name)).not.toBeAttached();
  }
}
