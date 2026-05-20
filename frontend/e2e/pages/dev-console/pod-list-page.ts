import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class PodListPage extends BasePage {
  private readonly manageColumnsButton = this.page.locator('button[data-test="manage-columns"]');
  private readonly createdColumnCheckbox = this.page.locator('input[id="created"]');
  private readonly receivingTrafficCheckbox = this.page.locator('input[id="trafficStatus"]');
  private readonly confirmActionButton = this.page.locator('button[data-test="confirm-action"]');
  private readonly receivingTrafficColumnLabel = this.page.locator(
    '[data-label="Receiving Traffic"]',
  );

  constructor(page: Page) {
    super(page);
  }

  async enableReceivingTrafficColumn(): Promise<void> {
    await this.robustClick(this.manageColumnsButton);
    await this.createdColumnCheckbox.uncheck();
    await this.receivingTrafficCheckbox.check();
    await this.robustClick(this.confirmActionButton);
  }

  async expectReceivingTrafficColumnVisible(): Promise<void> {
    await expect(this.receivingTrafficColumnLabel).toBeVisible();
  }
}
