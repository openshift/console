import type { Locator } from '@playwright/test';

import { expect } from '../../fixtures';
import BasePage from '../base-page';

export class DeploymentPage extends BasePage {
  private readonly nameInput = this.page.getByTestId('form-name-input');
  private readonly strategyDropdown = this.page.getByTestId('deployment-strategy-type');
  private readonly imageNameInput = this.page.getByTestId('image-name');
  private readonly createButton = this.page.getByRole('button', { name: 'Create', exact: true });

  async navigateToCreateForm(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/deployments/~new/form`);
    await this.ensureFormView(this.nameInput);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async selectStrategy(strategyName: string): Promise<void> {
    await this.strategyDropdown.click();
    await this.page.getByRole('option', { name: strategyName }).click();
  }

  async fillImage(imageName: string): Promise<void> {
    await this.imageNameInput.fill(imageName);
  }

  async create(): Promise<void> {
    await expect(this.createButton).toBeEnabled();
    await this.robustClick(this.createButton);
  }

  async navigateToEditForm(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/deployments/${name}/form`);
    await this.ensureFormView(this.nameInput);
  }

  getAutoDeployImage(): Locator {
    return this.page.getByRole('checkbox', { name: 'Auto deploy when new Image is available' });
  }

  getAutoDeployConfig(): Locator {
    return this.page.getByRole('checkbox', {
      name: 'Auto deploy when deployment configuration changes',
    });
  }

  async reloadIfStale(): Promise<void> {
    const reloadButton = this.page.getByRole('button', { name: 'Reload', exact: true });
    const staleAlert = this.page.getByText('This object has been updated.', { exact: true });
    if (await staleAlert.isVisible().catch(() => false)) {
      await this.robustClick(reloadButton);
      await this.ensureFormView(this.nameInput);
      await expect(staleAlert).not.toBeVisible({ timeout: 30_000 });
    }
  }

  async save(): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: 'Save', exact: true }));
  }
}
