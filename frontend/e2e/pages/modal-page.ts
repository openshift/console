import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ModalPage extends BasePage {
  private readonly modalTitle = this.page.getByTestId('modal-title');
  private readonly cancelButton = this.page.getByTestId('modal-cancel-action');
  private readonly submitButton = this.page.getByTestId('confirm-action');

  getModalTitle(): Locator {
    return this.modalTitle;
  }

  getCancelButton(): Locator {
    return this.cancelButton;
  }

  getSubmitButton(): Locator {
    return this.submitButton;
  }

  async waitForOpen(): Promise<void> {
    await expect(this.cancelButton).toBeVisible({ timeout: 20_000 });
  }

  async waitForClosed(): Promise<void> {
    await expect(this.cancelButton).not.toBeAttached({ timeout: 30_000 });
  }

  async submit(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async cancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }
}
