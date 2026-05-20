import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class SearchPage extends BasePage {
  private readonly resourceFilterInput = this.page.locator('input[placeholder="Resources"]');
  private readonly resourceOptionsMenu = this.page.locator('[aria-label="Options menu"]');
  private readonly recentlyUsedSection = this.page.locator('[aria-labelledby="Recently-used"]');
  private readonly clearHistoryButton = this.page.locator('[data-test-id="close-icon"]');

  constructor(page: Page) {
    super(page);
  }

  async searchAndSelectResource(resourceName: string): Promise<void> {
    await this.robustClick(this.page.locator('[aria-label="Type to filter"]'));
    await this.resourceFilterInput.clear();
    await this.resourceFilterInput.fill(resourceName);
    await this.robustClick(this.page.locator(`label[id$="${resourceName}"]`));
  }

  async openResourceFilter(): Promise<void> {
    await expect(this.resourceOptionsMenu).toBeVisible();
    await this.robustClick(this.resourceOptionsMenu);
  }

  async expectRecentlyUsedToContain(resourceName: string): Promise<void> {
    await expect(
      this.recentlyUsedSection.locator(`[data-filter-text="AR${resourceName}"]`),
    ).toBeVisible();
  }

  async expectRecentlyUsedToContainAll(resources: string[]): Promise<void> {
    for (const resource of resources) {
      await expect(this.recentlyUsedSection.locator('label')).toContainText(resource);
    }
  }

  async clearHistory(): Promise<void> {
    await expect(this.clearHistoryButton).toBeVisible();
    await this.robustClick(this.clearHistoryButton, { force: true });
  }

  async expectRecentlyUsedNotVisible(): Promise<void> {
    await expect(this.recentlyUsedSection).not.toBeAttached();
  }
}
