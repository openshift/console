import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class HelmDetailsPage extends BasePage {
  private readonly title: Locator;
  private readonly statusText: Locator;
  private readonly detailsTab: Locator;
  private readonly resourcesTab: Locator;
  private readonly revisionHistoryTab: Locator;
  private readonly releaseNotesTab: Locator;
  private readonly actionsMenuButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = this.page.locator('[data-test-section-heading="Helm Release details"]');
    this.statusText = this.page.getByTestId('helm-release-status-details').getByTestId('status-text');
    this.detailsTab = this.page.locator('[data-test-id="horizontal-link-Details"]');
    this.resourcesTab = this.page.locator('[data-test-id="horizontal-link-Resources"]');
    this.revisionHistoryTab = this.page.getByTestId('horizontal-link-Revision history');
    this.releaseNotesTab = this.page.getByTestId('horizontal-link-Release notes');
    this.actionsMenuButton = this.page.locator('[data-test-id="actions-menu-button"]');
  }

  async verifyTitle(): Promise<void> {
    await expect(this.title).toBeVisible();
  }

  async verifyHelmReleaseStatus(): Promise<void> {
    await expect(this.statusText).toBeVisible();
  }

  async verifyAllTabs(): Promise<void> {
    await expect(this.detailsTab).toBeVisible();
    await expect(this.resourcesTab).toBeVisible();
    await expect(this.revisionHistoryTab).toBeVisible();
    await expect(this.releaseNotesTab).toBeVisible();
  }

  async verifyActionsDropdown(): Promise<void> {
    await expect(this.actionsMenuButton).toBeVisible();
  }

  async clickActionsMenu(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
  }

  async verifyActionsInActionMenu(): Promise<void> {
    const actions = ['Upgrade', 'Rollback', 'Delete Helm Release'];
    const actionItems = this.page.locator('[data-test-id="action-items"] li');
    const count = await actionItems.count();

    for (let i = 0; i < count; i++) {
      const text = await actionItems.nth(i).textContent();
      expect(actions).toContain(text?.trim());
    }
  }

  async selectAction(action: 'Upgrade' | 'Rollback' | 'Delete Helm Release'): Promise<void> {
    const actionLocator = this.page
      .locator('[data-test-id="action-items"] li')
      .filter({ hasText: action });
    await this.robustClick(actionLocator);
  }

  async clickRevisionHistoryTab(): Promise<void> {
    await this.robustClick(this.revisionHistoryTab);
  }

  async verifyRevisionHistoryStatus(): Promise<void> {
    await this.clickRevisionHistoryTab();
    await expect(this.page.locator('[data-test="helm-revision-list"] [data-test="success-icon"]')).toBeVisible();
  }

  async verifyFieldValue(fieldName: string, fieldValue: string): Promise<void> {
    const field = this.page
      .locator('dl dt')
      .filter({ hasText: fieldName })
      .locator('xpath=following-sibling::dd[1]');
    await expect(field).toContainText(fieldValue);
  }
}
