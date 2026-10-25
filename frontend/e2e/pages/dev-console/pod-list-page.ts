import type { Locator } from '@playwright/test';

import { expect } from '../../fixtures';
import BasePage from '../base-page';

export class PodListPage extends BasePage {
  private readonly manageColumnsButton = this.page.getByTestId('manage-columns');
  private readonly columnManagementModal = this.page.getByRole('dialog', {
    name: 'Manage columns',
    exact: true,
  });
  private readonly saveColumnsButton = this.columnManagementModal.getByRole('button', {
    name: 'Save',
    exact: true,
  });

  async navigateToPods(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/pods`);
  }

  async navigateToPodsAllProjects(): Promise<void> {
    await this.goTo('/k8s/all-namespaces/pods');
  }

  getColumnCheckbox(label: string): Locator {
    return this.columnManagementModal.getByRole('checkbox', { name: label, exact: true });
  }

  async showReceivingTrafficColumn(): Promise<void> {
    await this.robustClick(this.manageColumnsButton);
    await this.getColumnCheckbox('Created').uncheck();
    await this.getColumnCheckbox('Receiving Traffic').check();
    await this.robustClick(this.saveColumnsButton);
    await expect(this.columnManagementModal).toBeHidden();
  }

  getColumnHeader(label: string): Locator {
    return this.page.getByRole('columnheader', { name: label });
  }
}
