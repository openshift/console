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
    await this.waitForLoadingComplete();
    const actionItem = this.page.getByRole('menuitem', { name: action });
    await this.robustClick(actionItem);
  }

  getTab(tabName: string): Locator {
    return this.dialog.getByRole('tab', { name: tabName });
  }

  async selectTab(tabName: string): Promise<void> {
    const tab = this.getTab(tabName);
    await this.robustClick(tab);
    await this.waitForLoadingComplete();
  }

  async clickResourceLink(href: string): Promise<void> {
    const link = this.dialog.locator(`a[href="${href}"]`);
    await this.robustClick(link);
  }
}
