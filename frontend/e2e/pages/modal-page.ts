import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ModalPage extends BasePage {
  private readonly cancelButton: Locator = this.page.getByTestId('modal-cancel-action');
  private readonly submitButton: Locator = this.page.getByTestId('confirm-action');
  private readonly modalTitle: Locator = this.page.getByTestId('modal-title');

  async waitForOpen(timeoutMs = 20_000): Promise<void> {
    await this.cancelButton.waitFor({ state: 'visible', timeout: timeoutMs });
    await this.cancelButton.scrollIntoViewIfNeeded();
  }

  async waitForClosed(): Promise<void> {
    await this.cancelButton.waitFor({ state: 'detached', timeout: 10_000 });
  }

  async submit(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async cancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  get title(): Locator {
    return this.modalTitle;
  }

  get submitLocator(): Locator {
    return this.submitButton;
  }
}
