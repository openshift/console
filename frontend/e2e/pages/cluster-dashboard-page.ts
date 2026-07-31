import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ClusterDashboardPage extends BasePage {
  private readonly detailsCard = this.page.getByTestId('details-card');
  private readonly statusCard = this.page.getByTestId('status-card');
  private readonly inventoryCard = this.page.getByTestId('inventory-card');
  private readonly utilizationCard = this.page.getByTestId('utilization-card');
  private readonly detailItemTitle = this.page.getByTestId('detail-item-title');
  private readonly detailItemValue = this.page.getByTestId('detail-item-value');
  private readonly viewSettingsLink = this.page.getByTestId('details-card-view-settings');
  private readonly viewAlertsLink = this.page.getByTestId('status-card-view-alerts');
  private readonly resourceInventoryItem = this.page.getByTestId('resource-inventory-item');
  private readonly utilizationItem = this.page.getByTestId('utilization-item');
  private readonly utilizationItemTitle = this.page.getByTestId('utilization-item-title');
  private readonly durationSelect = this.page.getByTestId('duration-select');
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

  getDetailsCard(): Locator {
    return this.detailsCard;
  }

  getStatusCard(): Locator {
    return this.statusCard;
  }

  getInventoryCard(): Locator {
    return this.inventoryCard;
  }

  getUtilizationCard(): Locator {
    return this.utilizationCard;
  }

  getDetailItemTitle(): Locator {
    return this.detailItemTitle;
  }

  getDetailItemValue(): Locator {
    return this.detailItemValue;
  }

  getViewSettingsLink(): Locator {
    return this.viewSettingsLink;
  }

  getViewAlertsLink(): Locator {
    return this.viewAlertsLink;
  }

  getResourceInventoryItem(): Locator {
    return this.resourceInventoryItem;
  }

  getUtilizationItem(): Locator {
    return this.utilizationItem;
  }

  getUtilizationItemTitle(): Locator {
    return this.utilizationItemTitle;
  }

  getDurationSelect(): Locator {
    return this.durationSelect;
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

  async isInsightsDataAvailable(): Promise<boolean> {
    const popover = this.popover;
    const timeout = 30_000;
    /* eslint-disable no-restricted-syntax */
    const result = await Promise.race([
      popover.getByText('Temporarily unavailable.').waitFor({ state: 'visible', timeout }).then(() => 'no-data' as const),
      popover.getByText('Waiting for results.').waitFor({ state: 'visible', timeout }).then(() => 'no-data' as const),
      popover.getByText('Disabled.').waitFor({ state: 'visible', timeout }).then(() => 'no-data' as const),
      popover.locator('a[href*="console.redhat.com/openshift/insights/advisor"]').first().waitFor({ state: 'visible', timeout }).then(() => 'data' as const),
    ]).catch(() => 'no-data' as const);
    /* eslint-enable no-restricted-syntax */
    return result === 'data';
  }
}
