import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ClusterDashboardPage extends BasePage {
  private readonly statusCard = this.page.locator('[data-test-id="status-card"]');
  private readonly insightsHealthItem = this.page.locator(
    '[data-item-id="Insights-health-item"]',
  );
  private readonly insightsButton = this.page
    .getByTestId('Insights')
    .locator('button');
  private readonly popover = this.page.locator('.pf-v6-c-popover');

  async navigateToDashboard(): Promise<void> {
    await this.goTo('/dashboards');
    await this.waitForLoadingComplete();
  }

  async waitForStatusCardLoaded(): Promise<void> {
    await expect(this.statusCard).toBeVisible({ timeout: 30_000 });
    // eslint-disable-next-line no-restricted-syntax
    await this.statusCard.locator('.skeleton-health').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {
      // Skeletons may have already disappeared
    });
  }

  getInsightsHealthItem(): Locator {
    return this.insightsHealthItem;
  }

  getInsightsButton(): Locator {
    return this.insightsButton;
  }

  getPopover(): Locator {
    return this.popover;
  }

  async openInsightsPopup(): Promise<void> {
    await this.robustClick(this.insightsButton);
    await expect(this.popover).toBeVisible({ timeout: 10_000 });
  }
}
