import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';
import { ModalPage } from './modal-page';

export class SecretPage extends BasePage {
  private readonly secretNameInput = this.page.getByTestId('secret-name');
  private readonly saveButton = this.page.getByTestId('save-changes');
  private readonly revealValuesButton = this.page.getByTestId('reveal-values');
  private readonly secretDataContainer = this.page.getByTestId('secret-data');
  private readonly addCredentialsButton = this.page.getByTestId('add-credentials-button');
  private readonly removeEntryButton = this.page.getByTestId('remove-entry-button');
  private readonly authTypeToggle = this.page.getByTestId(
    'console-select-auth-type-menu-toggle',
  );
  private readonly webhookGenerateButton = this.page.getByTestId('webhook-generate-button');
  private readonly secretKeyInput = this.page.getByTestId('secret-key');
  private readonly fileInputTextarea = this.page.getByRole('textbox', {
    name: 'Value',
    exact: true,
  });
  private readonly binaryAlert = this.page.getByTestId('file-input-binary-alert');
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly createDropdown = this.page.getByTestId('item-create');
  private readonly actionsButton = this.page.getByTestId('actions-menu-button');
  private readonly secretDataTerms = this.page.getByTestId('secret-data-term');
  private readonly clipboards = this.page.getByTestId('copy-to-clipboard');
  private readonly imagePullForm = this.page.getByTestId('create-image-secret-form');
  private readonly usernameInput = this.page.getByTestId('secret-username');
  private readonly passwordInput = this.page.getByTestId('secret-password');
  private readonly sshKeyTextarea = this.page.getByTestId('ssh-privatekey-textarea');
  private readonly dockerConfigTextarea = this.page.getByTestId('docker-config-textarea');
  private readonly imagePasswordInput = this.page.getByTestId('image-secret-password');
  private readonly cancelButton = this.page.getByRole('button', { name: 'Cancel' });
  private readonly modal = new ModalPage(this.page);

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getBinaryAlert(): Locator {
    return this.binaryAlert;
  }

  getClipboards(): Locator {
    return this.clipboards;
  }

  getImagePullForms(): Locator {
    return this.imagePullForm;
  }

  getUsernameInput(): Locator {
    return this.usernameInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getSshKeyTextarea(): Locator {
    return this.sshKeyTextarea;
  }

  getDockerConfigTextarea(): Locator {
    return this.dockerConfigTextarea;
  }

  getImagePasswordInput(): Locator {
    return this.imagePasswordInput;
  }

  getFileInputTextarea(): Locator {
    return this.fileInputTextarea;
  }

  getSecretKeyInput(): Locator {
    return this.secretKeyInput;
  }

  async clickCreateSecretDropdownButton(secretType: string): Promise<void> {
    await this.robustClick(this.createDropdown);
    const menuItem = this.page.getByTestId(`dropdown-menu-${secretType}`).getByRole('menuitem');
    await this.robustClick(menuItem);
    await this.waitForLoadingComplete();
  }

  async fillName(name: string): Promise<void> {
    await this.secretNameInput.fill(name);
  }

  async fillSecretKey(key: string): Promise<void> {
    await this.secretKeyInput.fill(key);
  }

  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await this.robustClick(this.saveButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.saveButton.waitFor({ state: 'detached', timeout: 30_000 });
  }

  async revealValues(): Promise<void> {
    await this.waitForLoadingComplete();
    await this.robustClick(this.revealValuesButton, { timeout: 30_000 });
    await expect(this.secretDataContainer).toBeVisible();
  }

  async verifySecretData(expected: Record<string, unknown>, json = false): Promise<void> {
    await this.revealValues();
    const count = await this.secretDataTerms.count();
    const rendered: Record<string, unknown> = {};
    for (let i = 0; i < count; i++) {
      const key = (await this.secretDataTerms.nth(i).textContent()) ?? '';
      const value = (await this.clipboards.nth(i).textContent()) ?? '';
      rendered[key] = json ? JSON.parse(value) : value;
    }
    expect(rendered).toEqual(expected);
  }

  async checkKeyValueExist(key: string, value: string): Promise<void> {
    await this.revealValues();
    const count = await this.secretDataTerms.count();
    for (let i = 0; i < count; i++) {
      const termText = (await this.secretDataTerms.nth(i).textContent()) ?? '';
      if (termText === key) {
        await expect(this.clipboards.nth(i)).toContainText(value);
        return;
      }
    }
    throw new Error(`Secret key "${key}" not found among ${count} entries`);
  }

  async addKeyValueEntry(key: string, value: string): Promise<void> {
    await this.robustClick(this.addCredentialsButton);
    await this.secretKeyInput.last().clear();
    await this.secretKeyInput.last().fill(key);
    await this.fileInputTextarea.last().clear();
    await this.fileInputTextarea.last().fill(value);
  }

  async fillBasicAuth(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async fillSshKey(key: string): Promise<void> {
    await this.sshKeyTextarea.fill(key);
  }

  async fillDockerConfig(config: string): Promise<void> {
    await this.dockerConfigTextarea.fill(config);
  }

  async fillImagePullCredential(
    index: number,
    cred: { address: string; username: string; password: string; email: string },
  ): Promise<void> {
    const form = this.imagePullForm.nth(index);
    await form.getByTestId('image-secret-address').fill(cred.address);
    await form.getByTestId('image-secret-username').fill(cred.username);
    await form.getByTestId('image-secret-password').fill(cred.password);
    await form.getByTestId('image-secret-email').fill(cred.email);
  }

  async addCredentialEntry(): Promise<void> {
    await this.robustClick(this.addCredentialsButton);
  }

  async removeEntry(index = 0): Promise<void> {
    await this.robustClick(this.removeEntryButton.nth(index));
  }

  async cancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  async selectAuthType(type: string): Promise<void> {
    const option = this.page.getByTestId(type).getByRole('option');
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.robustClick(this.authTypeToggle);
      try {
        await option.click({ timeout: 5_000 });
        return;
      } catch {
        // Dropdown may have closed — retry
      }
    }
    throw new Error(`Auth type option "${type}" not found after 3 attempts`);
  }

  async generateWebhookKey(): Promise<void> {
    await this.robustClick(this.webhookGenerateButton);
  }

  async detailsPageIsLoaded(secretName: string): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.pageHeading).toContainText(secretName, { timeout: 30_000 });
    const dataOrEmpty = this.secretDataContainer.or(this.page.getByTestId('empty-box'));
    const tryAgain = this.page.getByRole('button', { name: 'Try again' });
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await tryAgain.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tryAgain.click();
        await this.waitForLoadingComplete();
        continue;
      }
      break;
    }
    await expect(dataOrEmpty.first()).toBeVisible({ timeout: 30_000 });
  }

  private async clickAction(actionName: string): Promise<void> {
    const action = this.page.getByTestId(actionName);
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.robustClick(this.actionsButton);
      try {
        await action.click({ timeout: 5_000 });
        return;
      } catch {
        // Menu may have closed or items not loaded yet — retry
      }
    }
    throw new Error(`Action "${actionName}" not found after 3 attempts`);
  }

  async editSecret(): Promise<void> {
    await this.clickAction('Edit Secret');
  }

  async deleteSecret(): Promise<void> {
    await this.clickAction('Delete Secret');
    await this.modal.waitForOpen();
    await this.modal.submit();
    await this.modal.waitForClosed();
  }

  async addToWorkload(
    workloadName: string,
    asType: 'environment' | 'volume',
    options?: { prefix?: string; mountPath?: string },
  ): Promise<void> {
    await this.clickAction('Add Secret to workload');
    await this.modal.waitForOpen();

    await this.robustClick(this.page.getByTestId('add-secret-to-workload-button'));
    await this.page.getByTestId('console-select-search-input').locator('input').fill(workloadName);
    await this.page.getByTestId('console-select-item').click();

    if (asType === 'environment') {
      await this.page.getByTestId('Environment variables-radio-input').click();
      if (options?.prefix) {
        await this.page.getByTestId('add-secret-to-workload-prefix').fill(options.prefix);
      }
    } else {
      await this.page.getByTestId('Volume-radio-input').click();
      if (options?.mountPath) {
        await this.page.getByTestId('add-secret-to-workload-mountpath').fill(options.mountPath);
      }
    }

    await expect(this.modal.getSubmitButton()).toBeEnabled();
    await this.modal.submit();
    await this.modal.waitForClosed();
  }

  async uploadFile(filePath: string): Promise<void> {
    const fileInput = this.page.locator('.co-file-input input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  static encode(username: string, password: string): string {
    return Buffer.from(`${username}:${password}`).toString('base64');
  }
}
