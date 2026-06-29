import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class DetailsPage extends BasePage {
  private readonly pageHeading = this.page.locator('[data-test="page-heading"]');
  private readonly resourceTitle = this.page.locator('[data-test-id="resource-title"]');
  private readonly skeletonView = this.page.getByTestId('skeleton-detail-view');
  private readonly actionsMenuButton = this.page.locator('[data-test-id="actions-menu-button"]');
  readonly breadcrumbLink0 = this.page.locator('[data-test-id="breadcrumb-link-0"]');
  readonly statusPopoverButton = this.page.getByTestId('popover-status-button');
  readonly enableAutoscaleButton = this.page.getByTestId('enable-autoscale');
  readonly xtermViewport = this.page.locator('.xterm-viewport');
  readonly resourcesSuccessMessage = this.page.getByTestId('resources-successfully-created');
  readonly eventTotals = this.page.getByTestId('event-totals');
  admissionWarning(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  debugContainerLink(containerName?: string): Locator {
    const testId = containerName
      ? `popup-debug-container-link-${containerName}`
      : 'debug-container-link';
    return this.page.getByTestId(testId);
  }

  async titleShouldContain(title: string): Promise<void> {
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
    await expect(this.pageHeading).toContainText(title, { timeout: 30_000 });
  }

  sectionHeading(heading: string): Locator {
    return this.page.locator(`[data-test-section-heading="${heading}"]`);
  }

  async sectionHeaderShouldExist(sectionHeading: string): Promise<void> {
    await expect(this.sectionHeading(sectionHeading)).toBeVisible();
  }

  async isLoaded(): Promise<void> {
    await expect(this.skeletonView).toBeHidden({ timeout: 30_000 });
    await this.reloadIfModelNotFound();
    await expect(this.resourceTitle).toBeVisible({ timeout: 30_000 });
    await expect(this.resourceTitle).not.toBeEmpty();
  }

  async selectTab(name: string): Promise<void> {
    const tab = this.page.locator(`[data-test-id="horizontal-link-${name}"]`);
    await this.robustClick(tab);
  }

  async clickPageActionFromDropdown(actionID: string): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    const action = this.page.locator(`[data-test-action="${actionID}"]:not([disabled])`);
    await this.robustClick(action);
  }

  async clickBreadcrumb(): Promise<void> {
    await this.robustClick(this.breadcrumbLink0);
  }

  async clickStatusPopover(): Promise<void> {
    await this.robustClick(this.statusPopoverButton, { timeout: 60_000 });
  }

  async clickDebugContainerLink(containerName?: string): Promise<void> {
    await this.robustClick(this.debugContainerLink(containerName));
  }
}
