import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class HelmRollbackPage extends BasePage {
  private readonly pageTitle: Locator;
  private readonly revisionRadioButtons: Locator;
  private readonly rollbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = this.page.getByRole('heading', { name: /Rollback Helm Release/i });
    this.revisionRadioButtons = this.page.locator('[id^="form-radiobutton-revision"]');
    this.rollbackButton = this.page.getByRole('button', { name: 'Rollback' });
  }

  async verifyTitle(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async selectPreviousRevision(): Promise<void> {
    const count = await this.revisionRadioButtons.count();
    // Select the last revision (previous version)
    await this.revisionRadioButtons.nth(count - 1).check();
  }

  async clickRollback(): Promise<void> {
    await this.robustClick(this.rollbackButton);
    await this.waitForLoadingComplete(40_000);
  }
}
