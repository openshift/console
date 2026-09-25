import { expect, type Locator } from '@playwright/test';

import BasePage from './base-page';

export class ServiceAccountPage extends BasePage {
  private readonly actionsMenuButton: Locator = this.page.getByTestId('actions-menu-button');
  private readonly impersonateAction: Locator = this.page.getByRole('menuitem', {
    name: /Impersonate service account/,
  });
  private readonly downloadKubeconfigAction: Locator = this.page.getByRole('menuitem', {
    name: 'Download kubeconfig',
  });

  async navigateToDetails(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/~v1~ServiceAccount/${name}`);
    await expect(
      this.page.getByRole('heading', { level: 1 }).filter({ hasText: name }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await this.waitForDetailsActions(this.actionsMenuButton);
  }

  async impersonateFromDetails(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.impersonateAction);
  }

  async openActionsMenu(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
  }

  async downloadKubeconfigFromDetails(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.downloadKubeconfigAction);
  }

  getDownloadKubeconfigAction(): Locator {
    return this.downloadKubeconfigAction;
  }
}
