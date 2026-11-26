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
    const actionItem = this.page.getByRole('menuitem', { name: action });
    // The Actions menu can close again right after opening (for example when the
    // pane re-renders while actions reload). Retry the whole open-and-select
    // sequence instead of only waiting for the item, so a closed menu reopens.
    await expect(async () => {
      if (!(await actionItem.isVisible().catch(() => false))) {
        await this.clickActionsDropdown();
      }
      await actionItem.click({ timeout: 10_000 });
    }).toPass({ timeout: 60_000, intervals: [1_000, 2_000, 5_000] });
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
