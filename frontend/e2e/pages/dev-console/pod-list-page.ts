import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class PodListPage extends BasePage {
  private readonly manageColumnsButton = this.page.getByTestId('manage-columns');
  private readonly confirmButton = this.page.getByTestId('confirm-action');

  async navigateToPods(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/pods`);
  }

  async navigateToPodsAllProjects(): Promise<void> {
    await this.goTo('/k8s/all-namespaces/pods');
  }

  getColumnCheckbox(columnId: string): Locator {
    return this.page.locator(`input[id="${columnId}"]`);
  }

  async showReceivingTrafficColumn(): Promise<void> {
    await this.robustClick(this.manageColumnsButton);
    await this.getColumnCheckbox('created').uncheck();
    await this.getColumnCheckbox('traffic').check();
    await this.robustClick(this.confirmButton);
  }

  getColumnHeader(label: string): Locator {
    return this.page.locator(`[data-label="${label}"]`);
  }
}
