import { type Locator, expect } from '@playwright/test';

import BasePage from './base-page';

export class DetailsPage extends BasePage {
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly resourceTitle = this.page.getByTestId('resource-title');
  private readonly skeletonLoader = this.page.getByTestId('skeleton-detail-view');
  readonly nodeTerminalError: Locator = this.page.getByTestId('node-terminal-error');
  readonly xtermViewport: Locator = this.page.locator('.xterm-viewport');

  get title(): Locator {
    return this.resourceTitle;
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  async waitForPageLoad(): Promise<void> {
    try {
      // eslint-disable-next-line no-restricted-syntax
      await this.skeletonLoader.waitFor({ state: 'detached', timeout: 30_000 });
    } catch {
      // Skeleton may have already disappeared
    }
    await expect(this.resourceTitle.or(this.pageHeading).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  tab(name: string): Locator {
    return this.page.getByTestId(`horizontal-link-${name}`);
  }

  async clickPageAction(actionName: string): Promise<void> {
    await this.robustClick(this.page.getByTestId('actions-menu-button'));
    await this.robustClick(this.page.getByTestId(actionName));
  }

  getBreadcrumb(index: number): Locator {
    return this.page.getByTestId(`breadcrumb-link-${index}`);
  }

  async selectTab(name: string): Promise<void> {
    await this.navigateToTab(this.tab(name));
  }

  async clickKebabAction(actionId: string): Promise<void> {
    await this.robustClick(this.page.getByTestId(actionId));
  }

  getResourceRow(resourceId: string): Locator {
    const link = this.page.locator(`a[data-test="${resourceId}"]`);
    const fallback = this.page.locator(
      `[data-test="${resourceId}"], [data-test-action="${resourceId}"]`,
    );
    return link.or(fallback).first();
  }

  async clickResourceRow(resourceId: string): Promise<void> {
    const row = this.getResourceRow(resourceId);
    await this.robustClick(row);
  }

  getResourceByAction(actionName: string): Locator {
    return this.page.locator(`[data-test-action="${actionName}"]`);
  }

  async openResourceKebabMenu(actionName: string): Promise<void> {
    const resourceRow = this.getResourceByAction(actionName);
    const kebabButton = resourceRow.getByTestId('kebab-button');
    await this.robustClick(kebabButton);
  }

  getHeadingByName(name: string): Locator {
    return this.page.locator('h1', { hasText: name });
  }

  async clickActionsMenuAction(actionName: string): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: 'Actions' }));
    await this.robustClick(this.page.getByRole('menuitem', { name: actionName }));
  }

  async confirmDelete(): Promise<void> {
    await this.robustClick(
      this.page.getByRole('button', { name: 'Delete', exact: true }),
    );
  }
}
