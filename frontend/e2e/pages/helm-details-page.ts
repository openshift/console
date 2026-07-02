import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class HelmDetailsPage extends BasePage {
  private readonly sectionHeading = this.page.locator(
    '[data-test-section-heading="Helm Release details"]',
  );
  private readonly resourcesTab = this.page.locator(
    '[data-test-id="horizontal-link-Resources"]',
  );
  private readonly revisionHistoryTab = this.page.locator(
    '[data-test-id="horizontal-link-Revision history"]',
  );
  private readonly releaseNotesTab = this.page.locator(
    '[data-test-id="horizontal-link-Release notes"]',
  );
  private readonly actionsMenuButton = this.page.locator(
    '[data-test-id="actions-menu-button"]',
  );
  private readonly actionItems = this.page.locator('[data-test-id="action-items"]');
  private readonly pageHeading = this.page.getByTestId('page-heading').locator('h1');
  private readonly statusIcon = this.page.getByTestId('success-icon');
  private readonly statusText = this.page.getByTestId('status-text');
  private readonly statusDetails = this.page.getByTestId('helm-release-status-details');
  private readonly deleteModalTitle = this.page.locator('[data-test-id="modal-title"]');
  private readonly resourceNameText = this.page.getByTestId('resource-name');
  private readonly releaseNameInput = this.page.locator('#form-input-resourceName-field');
  private readonly confirmActionButton = this.page.getByTestId('confirm-action');

  getSectionHeading(): Locator {
    return this.sectionHeading;
  }

  getResourcesTab(): Locator {
    return this.resourcesTab;
  }

  getRevisionHistoryTab(): Locator {
    return this.revisionHistoryTab;
  }

  getReleaseNotesTab(): Locator {
    return this.releaseNotesTab;
  }

  getActionsMenuButton(): Locator {
    return this.actionsMenuButton;
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getStatusIcon(): Locator {
    return this.statusIcon;
  }

  getStatusText(): Locator {
    return this.statusText;
  }

  getStatusDetails(): Locator {
    return this.statusDetails;
  }

  async clickActionsMenu(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
  }

  async verifyActionsInMenu(): Promise<void> {
    const actions = ['Upgrade', 'Rollback', 'Delete Helm Release'];
    for (const action of actions) {
      const item = this.actionItems.locator('li', { hasText: action });
      await item.scrollIntoViewIfNeeded();
    }
  }

  getActionMenuItem(actionName: string): Locator {
    return this.actionItems.locator('li', { hasText: actionName });
  }

  async clickRevisionHistoryTab(): Promise<void> {
    await this.robustClick(this.revisionHistoryTab);
  }

  async enterReleaseNameInDeletePopup(releaseName: string): Promise<void> {
    await this.releaseNameInput.fill(releaseName);
  }

  async confirmDelete(): Promise<void> {
    await this.robustClick(this.confirmActionButton);
  }

  getDeleteModalTitle(): Locator {
    return this.deleteModalTitle;
  }

  getResourceNameText(): Locator {
    return this.resourceNameText;
  }
}
