import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class DetailsPage extends BasePage {
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly resourceTitle = this.page.getByTestId('resource-title');
  private readonly skeletonLoader = this.page.getByTestId('skeleton-detail-view');
  private readonly actionsMenuButton: Locator = this.page.getByTestId('actions-menu-button');
  readonly nodeTerminalError: Locator = this.page.getByTestId('node-terminal-error');
  readonly xtermViewport: Locator = this.page.locator('.xterm-viewport');

  get title(): Locator {
    return this.resourceTitle;
  }

  get heading(): Locator {
    return this.pageHeading;
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  async waitForLoaded(): Promise<void> {
    await this.skeletonLoader.waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
    await Promise.race([
      this.resourceTitle.waitFor({ state: 'visible', timeout: 30_000 }),
      this.pageHeading.waitFor({ state: 'visible', timeout: 30_000 }),
    ]);
  }

  tab(name: string): Locator {
    return this.page.getByTestId(`horizontal-link-${name}`);
  }

  async selectTab(name: string): Promise<void> {
    await this.navigateToTab(this.tab(name));
  }

  async navigateTo(url: string): Promise<void> {
    await this.goTo(url);
  }

  async clickPageActionFromDropdown(actionName: string): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    const action = this.page.getByTestId(actionName);
    await this.robustClick(action);
  }

  async clickKebabAction(actionId: string): Promise<void> {
    const action = this.page.getByTestId(actionId);
    await action.waitFor({ state: 'visible', timeout: 10_000 });
    await this.robustClick(action);
  }

  getResourceRow(resourceId: string): Locator {
    const link = this.page.locator(`a[data-test="${resourceId}"]`);
    const fallback = this.page.getByTestId(resourceId);
    return link.or(fallback).first();
  }

  async clickResourceRow(resourceId: string, waitForLoad = true): Promise<void> {
    const row = this.getResourceRow(resourceId);
    await row.waitFor({ state: 'visible', timeout: 30_000 });
    await this.robustClick(row);
    if (waitForLoad) {
      await this.waitForLoaded();
    }
  }

  getResourceByAction(actionName: string): Locator {
    return this.page.getByTestId(actionName);
  }

  async openResourceKebabMenu(actionName: string): Promise<void> {
    const resourceRow = this.page.getByTestId(`${actionName}-resource-row`);
    const kebabButton = resourceRow.getByTestId('kebab-button');
    await this.robustClick(kebabButton);
  }
}
