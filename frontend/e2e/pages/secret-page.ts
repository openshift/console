import { expect } from '@playwright/test';

import BasePage from './base-page';

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
  private readonly fileInputTextarea = this.page.locator('[data-test-id="file-input-textarea"]');
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly createDropdown = this.page.getByTestId('item-create');

  async clickCreateSecretDropdownButton(secretType: string): Promise<void> {
    await this.robustClick(this.createDropdown);
    const menuItem = this.page.locator(
      `[data-test-dropdown-menu="${secretType}"] [role="menuitem"]`,
    );
    await this.robustClick(menuItem);
    await this.waitForLoadingComplete();
    await this.secretNameInput.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async fillName(name: string): Promise<void> {
    await this.secretNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.secretNameInput.fill(name);
  }

  async save(): Promise<void> {
    await this.saveButton.waitFor({ state: 'visible', timeout: 10_000 });
    await expect(this.saveButton).toBeEnabled();
    await this.robustClick(this.saveButton);
    await this.saveButton.waitFor({ state: 'detached', timeout: 30_000 });
  }

  async revealValues(): Promise<void> {
    await this.waitForLoadingComplete();
    await this.revealValuesButton.waitFor({ state: 'visible', timeout: 30_000 });
    await this.robustClick(this.revealValuesButton);
    await this.secretDataContainer.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async verifySecretData(expected: Record<string, unknown>, json = false): Promise<void> {
    await this.revealValues();
    const terms = this.page.getByTestId('secret-data-term');
    const clipboards = this.page.getByTestId('copy-to-clipboard');
    const count = await terms.count();
    const rendered: Record<string, unknown> = {};
    for (let i = 0; i < count; i++) {
      const key = (await terms.nth(i).textContent()) ?? '';
      const value = (await clipboards.nth(i).textContent()) ?? '';
      rendered[key] = json ? JSON.parse(value) : value;
    }
    expect(rendered).toEqual(expected);
  }

  async checkKeyValueExist(key: string, value: string): Promise<void> {
    await this.revealValues();
    const terms = this.page.getByTestId('secret-data-term');
    const clipboards = this.page.getByTestId('copy-to-clipboard');
    const count = await terms.count();
    for (let i = 0; i < count; i++) {
      const termText = (await terms.nth(i).textContent()) ?? '';
      if (termText === key) {
        await expect(clipboards.nth(i)).toContainText(value);
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
    await this.page.getByTestId('secret-username').fill(username);
    await this.page.getByTestId('secret-password').fill(password);
  }

  async fillImagePullCredential(
    index: number,
    cred: { address: string; username: string; password: string; email: string },
  ): Promise<void> {
    const form = this.page.locator('[data-test-id="create-image-secret-form"]').nth(index);
    await form.locator('[data-test="image-secret-address"]').fill(cred.address);
    await form.locator('[data-test="image-secret-username"]').fill(cred.username);
    await form.locator('[data-test="image-secret-password"]').fill(cred.password);
    await form.locator('[data-test="image-secret-email"]').fill(cred.email);
  }

  async removeEntry(index = 0): Promise<void> {
    await this.robustClick(this.removeEntryButton.nth(index));
  }

  async selectAuthType(type: string): Promise<void> {
    const option = this.page.locator(`[data-test-dropdown-menu="${type}"] [role="option"]`);
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.authTypeToggle.click();
      try {
        await option.waitFor({ state: 'visible', timeout: 5_000 });
        await option.click();
        await this.authTypeToggle.waitFor({ state: 'visible', timeout: 5_000 });
        return;
      } catch {
        // Dropdown may have closed — retry
      }
    }
    throw new Error(`Auth type option "${type}" not found after 3 attempts`);
  }

  async generateWebhookKey(): Promise<void> {
    await this.webhookGenerateButton.waitFor({ state: 'visible' });
    await this.robustClick(this.webhookGenerateButton);
  }

  async detailsPageIsLoaded(secretName: string): Promise<void> {
    await this.waitForLoadingComplete();
    await expect(this.pageHeading).toContainText(secretName, { timeout: 30_000 });
    const dataOrEmpty = this.page.locator(
      '[data-test="secret-data"], .pf-v6-c-empty-state',
    );
    const tryAgain = this.page.getByRole('button', { name: 'Try again' });
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await tryAgain.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tryAgain.click();
        await this.waitForLoadingComplete();
        continue;
      }
      break;
    }
    await dataOrEmpty.first().waitFor({ state: 'visible', timeout: 30_000 });
  }

  private async clickAction(actionName: string): Promise<void> {
    const actionsButton = this.page.locator('[data-test-id="actions-menu-button"]');
    const action = this.page.locator(`[data-test-action="${actionName}"]`);
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.robustClick(actionsButton);
      try {
        await action.waitFor({ state: 'visible', timeout: 5_000 });
        await action.click();
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

  async deleteSecret(_secretName: string): Promise<void> {
    await this.clickAction('Delete Secret');
    const submitButton = this.page.locator('button[type=submit]');
    await submitButton.waitFor({ state: 'visible', timeout: 10_000 });
    await submitButton.click();
    await submitButton.waitFor({ state: 'detached', timeout: 30_000 });
  }

  async addToWorkload(
    workloadName: string,
    asType: 'environment' | 'volume',
    options?: { prefix?: string; mountPath?: string },
  ): Promise<void> {
    await this.page.getByTestId('Add Secret to workload').click();
    const cancelButton = this.page.locator('[data-test-id="modal-cancel-action"]');
    await cancelButton.waitFor({ state: 'visible', timeout: 20_000 });

    await this.page.locator('#co-add-secret-to-workload__workload').click();
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

    const confirmButton = this.page.locator('[data-test="confirm-action"]');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await cancelButton.waitFor({ state: 'detached', timeout: 30_000 });
  }

  async uploadFile(filePath: string): Promise<void> {
    const fileInput = this.page.locator('.co-file-input input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  static encode(username: string, password: string): string {
    return Buffer.from(`${username}:${password}`).toString('base64');
  }
}
