import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class DetailsPage extends BasePage {
  private readonly pageHeading = this.page.getByTestId('page-heading');

  /**
   * Get the page heading locator
   */
  getPageHeading(): Locator {
    return this.pageHeading;
  }

  async clickPageAction(actionName: string): Promise<void> {
    await this.robustClick(this.page.getByTestId('actions-menu-button'));
    await this.robustClick(this.page.getByTestId(actionName));
  }

  getBreadcrumb(index: number): Locator {
    return this.page.getByTestId(`breadcrumb-link-${index}`);
  }

  /**
   * Select a specific tab by name
   */
  async selectTab(tabName: string): Promise<void> {
    const tab = this.page.getByTestId(`horizontal-link-${tabName}`);
    await this.robustClick(tab);
    await this.waitForLoadingComplete();
  }

  /**
   * Click a kebab menu action (assumes menu is already open)
   */
  async clickKebabAction(actionId: string): Promise<void> {
    const action = this.page.locator(`[data-test-action="${actionId}"]`);
    await this.robustClick(action);
  }

  /**
   * Get a resource row link by test ID (e.g., for ClusterOperators or Configuration resources)
   * Uses data-test attribute (modern selector convention)
   */
  getResourceRow(resourceId: string): Locator {
    // Prefer the link with data-test (for Configuration resources)
    // Fall back to any element with data-test or data-test-action
    const link = this.page.locator(`a[data-test="${resourceId}"]`);
    const fallback = this.page.locator(
      `[data-test="${resourceId}"], [data-test-action="${resourceId}"]`,
    );

    // Return link if it exists, otherwise fallback
    return link.or(fallback).first();
  }

  /**
   * Click a resource row to navigate to its details
   */
  async clickResourceRow(resourceId: string): Promise<void> {
    const row = this.getResourceRow(resourceId);
    await this.robustClick(row);
  }

  /**
   * Get a resource row by test-action attribute (for Configuration resources)
   */
  getResourceByAction(actionName: string): Locator {
    return this.page.locator(`[data-test-action="${actionName}"]`);
  }

  /**
   * Click a resource in Configuration tab and open its kebab menu
   */
  async openResourceKebabMenu(actionName: string): Promise<void> {
    const resourceRow = this.getResourceByAction(actionName);
    const kebabButton = resourceRow.getByTestId('kebab-button');
    await this.robustClick(kebabButton);
  }
}
