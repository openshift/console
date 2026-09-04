import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';
import { ClusterSettingsPage } from './cluster-settings-page';
import { ModalPage } from './modal-page';

export class OperatorHubDetailsPage extends BasePage {
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly editDefaultSourcesButton = this.page.getByTestId(
    'Default sources-details-item__edit-button',
  );
  private readonly modalPage = new ModalPage(this.page);
  private readonly clusterSettingsPage = new ClusterSettingsPage(this.page);

  /**
   * Navigate to OperatorHub details page via cluster settings configuration
   */
  async navigateToOperatorHub(): Promise<void> {
    await this.clusterSettingsPage.navigateToConfiguration();
    await this.robustClick(this.page.getByTestId('OperatorHub'));
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Get page heading locator
   */
  getPageHeading(): Locator {
    return this.pageHeading;
  }

  /**
   * Click the edit button for default sources
   */
  async openEditDefaultSourcesModal(): Promise<void> {
    await this.robustClick(this.editDefaultSourcesButton);
    await this.modalPage.waitForOpen();
  }

  /**
   * Get the status locator for a specific source
   */
  getSourceStatus(sourceName: string): Locator {
    return this.page.getByTestId(`status_${sourceName}`);
  }

  /**
   * Toggle a default source in the edit modal
   */
  async toggleDefaultSource(sourceName: string): Promise<void> {
    const checkbox = this.page.getByTestId(`${sourceName}__checkbox`);
    await this.robustClick(checkbox);
  }

  /**
   * Submit the edit default sources modal
   */
  async submitModal(): Promise<void> {
    await this.modalPage.submit();
    await this.modalPage.waitForClosed();
  }

  /**
   * Get modal page instance for modal-specific operations
   */
  getModal(): ModalPage {
    return this.modalPage;
  }

  /**
   * Verify section heading exists
   */
  async verifySectionHeading(heading: string): Promise<void> {
    const sectionHeading = this.page.getByTestId(`section-heading-${heading}`);
    await expect(sectionHeading).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Complete flow: toggle source, verify status, and toggle back
   */
  async toggleSourceAndVerify(
    sourceName: string,
    statusAfterToggle: string,
    statusAfterRevert: string,
  ): Promise<void> {
    // First toggle
    await this.openEditDefaultSourcesModal();
    await expect(this.modalPage.getModalTitle()).toContainText('Edit default sources');
    await this.toggleDefaultSource(sourceName);
    await this.submitModal();

    // Verify status change
    await expect(this.getSourceStatus(sourceName)).toHaveText(statusAfterToggle, {
      timeout: 60_000,
    });

    // Toggle back
    await this.openEditDefaultSourcesModal();
    await expect(this.modalPage.getModalTitle()).toContainText('Edit default sources');
    await this.toggleDefaultSource(sourceName);
    await this.submitModal();

    // Verify status back to original
    await expect(this.getSourceStatus(sourceName)).toHaveText(statusAfterRevert, {
      timeout: 60_000,
    });
  }
}