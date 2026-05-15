import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ModalPage extends BasePage {
  private get cancelButton() {
    return this.page.locator('[data-test-id="modal-cancel-action"]');
  }

  private get submitButton() {
    return this.page.locator('button[type=submit]');
  }

  async shouldBeOpened(): Promise<void> {
    await this.cancelButton.scrollIntoViewIfNeeded();
    await expect(this.cancelButton).toBeVisible({ timeout: 20_000 });
  }

  async shouldBeClosed(): Promise<void> {
    await expect(this.cancelButton).toBeHidden();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async submitShouldBeDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async submitShouldBeEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }
}
