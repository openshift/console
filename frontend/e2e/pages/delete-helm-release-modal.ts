import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class DeleteHelmReleaseModal extends BasePage {
  private readonly modal: Locator;
  private readonly modalTitle: Locator;
  private readonly resourceNameDisplay: Locator;
  private readonly releaseNameInput: Locator;
  private readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modal = this.page.getByRole('dialog', { name: 'Warning alert: Delete Helm' });
    this.modalTitle = this.page.locator('[data-test-id="modal-title"]');
    this.resourceNameDisplay = this.page.getByTestId('resource-name');
    this.releaseNameInput = this.page.locator('#form-input-resourceName-field');
    this.deleteButton = this.page.getByTestId('confirm-action');
  }

  async verifyModalOpen(releaseName: string): Promise<void> {
    await expect(this.modalTitle).toContainText('Delete Helm Release?');
    await expect(this.resourceNameDisplay).toHaveText(releaseName);
  }

  async enterReleaseName(releaseName: string): Promise<void> {
    await this.releaseNameInput.fill(releaseName);
  }

  async clickDelete(): Promise<void> {
    await this.robustClick(this.deleteButton, { force: true });

    // Wait for modal to close
    await expect(this.modal).not.toBeAttached({ timeout: 10_000 });
  }
}
