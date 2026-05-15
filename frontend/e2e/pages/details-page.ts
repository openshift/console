import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class DetailsPage extends BasePage {
  private readonly pageHeading = this.page.locator('[data-test="page-heading"]');
  private readonly resourceTitle = this.page.locator('[data-test-id="resource-title"]');
  private readonly skeletonDetailView = this.page.getByTestId('skeleton-detail-view');
  private readonly actionsMenuButton = this.page.locator('[data-test-id="actions-menu-button"]');

  constructor(page: Page) {
    super(page);
  }

  async isLoaded(): Promise<void> {
    await expect(this.skeletonDetailView).not.toBeAttached({ timeout: 30_000 });
    await expect(this.resourceTitle).not.toBeEmpty({ timeout: 30_000 });
  }

  async titleShouldContain(title: string): Promise<void> {
    await expect(this.pageHeading).toBeAttached({ timeout: 30_000 });
    await expect(this.pageHeading).toContainText(title, { timeout: 30_000 });
  }

  async sectionHeaderShouldExist(heading: string): Promise<void> {
    await expect(this.page.locator(`[data-test-section-heading="${heading}"]`)).toBeAttached();
  }

  async selectTab(name: string): Promise<void> {
    const tab = this.page.locator(`[data-test-id="horizontal-link-${name}"]`);
    await expect(tab).toBeAttached();
    await this.robustClick(tab);
    await this.waitForLoadingComplete();
  }

  async clickPageActionFromDropdown(actionID: string): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.page.locator(`[data-test-action="${actionID}"]:not([disabled])`));
  }

  async clickPageActionButton(action: string): Promise<void> {
    const actionButton = this.page.locator('[data-test-id="details-actions"]', {
      hasText: action,
    });
    await this.robustClick(actionButton);
  }

  sectionHeading(name: string): Locator {
    return this.page.locator(`[data-test-section-heading="${name}"]`);
  }

  detailsItemLabel(name: string): Locator {
    return this.page.locator(`[data-test-selector="details-item-label__${name}"]`);
  }

  detailsItemValue(name: string): Locator {
    return this.page.locator(`[data-test-selector="details-item-value__${name}"]`);
  }

  horizontalNavTab(tabId: string): Locator {
    return this.page.locator(`[data-test-id="horizontal-link-${tabId}"]`);
  }

  breadcrumb(index: number): Locator {
    return this.page.locator(`[data-test-id="breadcrumb-link-${index}"]`);
  }
}
