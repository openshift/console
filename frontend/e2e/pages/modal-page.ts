import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ModalPage extends BasePage {
  private readonly cancelButton = this.page.locator('[data-test-id="modal-cancel-action"]');
  private readonly submitBtn = this.page.locator('button[type=submit]');
  private readonly modalTitle = this.page.locator('[data-test-id="modal-title"]');

  constructor(page: Page) {
    super(page);
  }

  async shouldBeOpened(): Promise<void> {
    await this.cancelButton.scrollIntoViewIfNeeded({ timeout: 20_000 });
    await expect(this.cancelButton).toBeVisible();
  }

  async shouldBeClosed(): Promise<void> {
    await expect(this.cancelButton).not.toBeAttached();
  }

  async submit(force = false): Promise<void> {
    await this.robustClick(this.submitBtn, { force });
  }

  async cancel(force = false): Promise<void> {
    await this.robustClick(this.cancelButton, { force });
  }

  async modalTitleShouldContain(title: string): Promise<void> {
    await expect(this.modalTitle).toContainText(title);
  }

  async submitShouldBeDisabled(): Promise<void> {
    await expect(this.submitBtn).toBeDisabled();
  }

  async submitShouldBeEnabled(): Promise<void> {
    await expect(this.submitBtn).not.toBeDisabled();
  }
}
