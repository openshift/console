import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';
import { ModalPage } from './modal-page';

export class SecretsPage extends BasePage {
  private readonly modal = new ModalPage(this.page);
  private readonly secretNameInput = this.page.getByTestId('secret-name');
  private readonly secretKeyInput = this.page.getByTestId('secret-key');
  private readonly saveButton = this.page.getByTestId('save-changes');
  private readonly binaryAlert = this.page.getByTestId('file-input-binary-alert');
  private readonly fileInputTextarea = this.page.getByTestId('file-input-textarea');
  private readonly addCredentialsButton = this.page.getByTestId('add-credentials-button');
  private readonly removeEntryButton = this.page.getByTestId('remove-entry-button');
  private readonly revealValuesButton = this.page.getByTestId('reveal-values');
  private readonly secretData = this.page.getByTestId('secret-data');
  private readonly secretDataTerm = this.page.getByTestId('secret-data-term');
  private readonly copyToClipboard = this.page.getByTestId('copy-to-clipboard');
  private readonly pageHeading = this.page.getByTestId('page-heading').locator('h1');

  private readonly credentialForm = this.page.getByTestId('create-image-secret-form');
  private readonly authTypeToggle = this.page.getByTestId('console-select-auth-type-menu-toggle');
  private readonly addressInput = this.page.getByTestId('image-secret-address');
  private readonly usernameInput = this.page.getByTestId('image-secret-username');
  private readonly passwordInput = this.page.getByTestId('image-secret-password');
  private readonly emailInput = this.page.getByTestId('image-secret-email');
  private readonly secretPasswordInput = this.page.getByTestId('secret-password');

  async navigateToCreateGenericSecret(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/secrets/~new/generic`);
  }

  async navigateToEditSecret(namespace: string, secretName: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/secrets/${secretName}/edit`);
  }

  async navigateToSecretDetails(namespace: string, secretName: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/secrets/${secretName}`);
  }

  async enterSecretName(name: string): Promise<void> {
    await this.secretNameInput.fill(name);
  }

  async fillSecretKey(key: string, index = 0): Promise<void> {
    await this.secretKeyInput.nth(index).fill(key);
  }

  async uploadFile(filePath: string): Promise<void> {
    await this.page.locator('input[type="file"]').first().setInputFiles(filePath);
  }

  async save(): Promise<void> {
    await this.robustClick(this.saveButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.saveButton.waitFor({ state: 'detached', timeout: 30_000 });
  }

  async addKeyValue(key: string, value: string): Promise<void> {
    await this.robustClick(this.addCredentialsButton);
    await this.secretKeyInput.last().fill(key);
    await this.fileInputTextarea.last().fill(value);
  }

  async waitForSecretDataReady(): Promise<void> {
    await this.waitForLoadingComplete();
    const tryAgain = this.page.getByRole('button', { name: 'Try again' });
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await tryAgain.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tryAgain.click();
        await this.waitForLoadingComplete();
        continue;
      }
      break;
    }
    const dataOrEmpty = this.secretData.or(this.page.locator('.pf-v6-c-empty-state'));
    await expect(dataOrEmpty.first()).toBeVisible({ timeout: 30_000 });
  }

  async clickRevealValues(): Promise<void> {
    await this.waitForSecretDataReady();
    await this.robustClick(this.revealValuesButton);
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getBinaryAlert(): Locator {
    return this.binaryAlert;
  }

  getFileInputTextarea(): Locator {
    return this.fileInputTextarea;
  }

  getSecretData(): Locator {
    return this.secretData;
  }

  getSecretDataTerm(): Locator {
    return this.secretDataTerm;
  }

  getCopyToClipboard(): Locator {
    return this.copyToClipboard;
  }

  getSecretKeyInput(): Locator {
    return this.secretKeyInput;
  }

  async navigateToCreateImagePullSecret(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/secrets/~new/image`);
  }

  async navigateToCreateSourceSecret(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/secrets/~new/source`);
  }

  async navigateToCreateWebhookSecret(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/secrets/~new/webhook`);
  }

  async clickAddCredentials(): Promise<void> {
    await this.robustClick(this.addCredentialsButton);
  }

  async clickRemoveFirstEntry(): Promise<void> {
    await this.robustClick(this.removeEntryButton.first());
  }

  async fillCredentialEntry(
    index: number,
    address: string,
    username: string,
    password: string,
    email: string,
  ): Promise<void> {
    const form = this.credentialForm.nth(index);
    await form.getByTestId('image-secret-address').fill(address);
    await form.getByTestId('image-secret-username').fill(username);
    await form.getByTestId('image-secret-password').fill(password);
    await form.getByTestId('image-secret-email').fill(email);
  }

  async selectAuthType(type: string): Promise<void> {
    await this.robustClick(this.authTypeToggle);
    await this.robustClick(this.page.getByTestId(`dropdown-menu-${type}`));
  }

  async checkSecretData(expected: Record<string, unknown>, jsonOutput = false): Promise<void> {
    await this.clickRevealValues();
    const terms = this.secretDataTerm;
    const values = this.copyToClipboard;
    const termCount = await terms.count();
    const rendered: Record<string, unknown> = {};
    for (let i = 0; i < termCount; i++) {
      const key = (await terms.nth(i).textContent()) ?? '';
      const val = (await values.nth(i).textContent()) ?? '';
      rendered[key] = jsonOutput ? JSON.parse(val) : val;
    }
    expect(rendered).toEqual(expected);
  }

  getCredentialForm(): Locator {
    return this.credentialForm;
  }

  getAddressInput(): Locator {
    return this.addressInput;
  }

  getUsernameInput(): Locator {
    return this.usernameInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getEmailInput(): Locator {
    return this.emailInput;
  }

  getSecretPasswordInput(): Locator {
    return this.secretPasswordInput;
  }

  async addToWorkload(
    workloadName: string,
    asType: 'environment' | 'volume',
    options?: { prefix?: string; mountPath?: string },
  ): Promise<void> {
    await this.robustClick(this.page.getByTestId('Add Secret to workload'));
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

    await this.modal.submit();
    await this.modal.waitForClosed();
  }
}
