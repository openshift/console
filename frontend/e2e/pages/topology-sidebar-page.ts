import { expect } from '../fixtures';

import BasePage from './base-page';

export class TopologySidebarPage extends BasePage {
  private readonly dialog = this.page.getByTestId('topology-sidepane');
  private readonly actionsDropdown = this.page.getByTestId('actions-menu-button');

  async verify(): Promise<void> {
    await expect(this.dialog).toBeVisible({ timeout: 30_000 });
  }

  async clickActionsDropdown(): Promise<void> {
    await this.robustClick(this.actionsDropdown);
  }

  async selectAction(action: string): Promise<void> {
    await this.clickActionsDropdown();
    await this.waitForLoadingComplete();
    const actionItem = this.page.getByRole('menuitem', { name: action });
    await this.robustClick(actionItem);
  }
}
