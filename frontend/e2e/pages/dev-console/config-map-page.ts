import type { Locator } from '@playwright/test';

import { expect } from '../../fixtures';
import BasePage from '../base-page';

export class ConfigMapPage extends BasePage {
  private readonly nameInput = this.page.getByTestId('configmap-name');
  private readonly addKeyValueButton = this.page.getByTestId('add-key-value-button').first();
  private readonly saveButton = this.page.getByTestId('save-changes');

  async navigateToCreateForm(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/configmaps/~new/form`);
    await this.ensureFormView(this.nameInput);
  }

  async navigateToEditForm(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/configmaps/${name}/form`);
    await this.ensureFormView(this.nameInput);
  }

  getKeyInput(index: number): Locator {
    return this.page.getByTestId(`key-${index}`);
  }

  getValueTextarea(index: number): Locator {
    return this.page.getByRole('textbox', { name: 'Value', exact: true }).nth(index);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillKeyValue(index: number, key: string, value: string): Promise<void> {
    await this.getKeyInput(index).fill(key);
    await this.getValueTextarea(index).fill(value);
  }

  async addKeyValue(): Promise<void> {
    await this.robustClick(this.addKeyValueButton);
  }

  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await this.robustClick(this.saveButton);
  }

  getEditHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Edit ConfigMap' });
  }

  getKeyText(key: string): Locator {
    return this.page.getByText(key);
  }
}
