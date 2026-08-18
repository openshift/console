import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ServiceAccountPage extends BasePage {
  private readonly actionsMenuButton: Locator = this.page.getByTestId('actions-menu-button');
  private readonly impersonateAction: Locator = this.page.getByRole('menuitem', {
    name: /Impersonate service account/,
  });

  async navigateToDetails(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/core~v1~ServiceAccount/${name}`);
  }

  async impersonateFromDetails(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.impersonateAction);
  }
}
