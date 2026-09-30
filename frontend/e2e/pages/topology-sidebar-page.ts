import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';

export class TopologySidebarPage extends BasePage {
  private readonly dialog = this.page.getByTestId('topology-sidepane');
  private readonly actionsDropdown = this.page.getByTestId('actions-menu-button');

  async verify(): Promise<void> {
    await expect(this.dialog).toBeVisible({ timeout: 30_000 });
  }

  async clickActionsDropdown(): Promise<void> {
    await this.robustClick(this.actionsDropdown, { timeout: 60_000 });
  }

  async selectAction(action: string): Promise<void> {
    await this.clickActionsDropdown();
    const actionItem = this.page.getByRole('menuitem', { name: action });
    await this.robustClick(actionItem);
  }

  getTab(tabName: string): Locator {
    return this.dialog.getByRole('tab', { name: tabName });
  }

  async clickTab(tabName: string): Promise<void> {
    await this.robustClick(this.getTab(tabName));
  }

  async clickTypedResourceLink(resourcePath: string): Promise<void> {
    const link = this.dialog.locator(`a[href*="${resourcePath}"]`);
    await this.robustClick(link.first());
  }
}
