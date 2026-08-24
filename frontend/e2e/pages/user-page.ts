import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';

export class UserPage extends BasePage {
  private readonly actionsMenuButton: Locator = this.page.getByTestId('actions-menu-button');
  private readonly impersonateAction: Locator = this.page.getByRole('menuitem', {
    name: /Impersonate user/,
  });

  async navigateToDetails(name: string): Promise<void> {
    await this.goTo(`/k8s/cluster/user.openshift.io~v1~User/${name}`);
    await expect(this.page.getByRole('heading', { level: 1 }).filter({ hasText: name })).toBeVisible({
      timeout: 60_000,
    });
    await this.waitForDetailsActions(this.actionsMenuButton);
  }

  async impersonateFromDetails(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.impersonateAction);
  }
}
