import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class ClusterSettingsPage extends BasePage {
  // Navigation elements
  private readonly pageHeading = this.page.getByTestId('cluster-settings-page-heading');
  private readonly detailsTab = this.page.getByTestId('horizontal-link-Details');
  private readonly clusterOperatorsTab = this.page.getByTestId('horizontal-link-ClusterOperators');
  private readonly configurationTab = this.page.getByTestId('horizontal-link-Configuration');

  // Channel elements
  private readonly currentChannelUpdateLink = this.page.getByTestId('current-channel-update-link');

  // Managed cluster elements
  private readonly hostedAlert = this.page.getByTestId('cluster-settings-alerts-hosted');
  private readonly updateButton = this.page.getByTestId('cv-update-button');
  private readonly upstreamServerUrl = this.page.getByTestId('cv-upstream-server-url');
  private readonly autoscalerLink = this.page.getByTestId('cv-autoscaler');

  // Modal elements
  private readonly modalTitle = this.page.getByTestId('modal-title');
  private readonly channelModalInput = this.page.getByTestId('channel-modal-input');
  private readonly channelModal = this.page.getByTestId('channel-modal');
  private readonly confirmActionButton = this.page.getByTestId('confirm-action');

  /**
   * Navigate to cluster settings details page
   */
  async navigateToDetails(): Promise<void> {
    await this.goTo('/settings/cluster');
    await expect(this.detailsTab).toBeVisible();
  }

  /**
   * Get the current channel update link locator
   */
  getCurrentChannelLink(): Locator {
    return this.currentChannelUpdateLink;
  }

  /**
   * Click the current channel update link to open the modal
   */
  async openChannelModal(): Promise<void> {
    await this.currentChannelUpdateLink.click();
    await expect(this.modalTitle).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Get the modal title locator
   */
  getModalTitle(): Locator {
    return this.modalTitle;
  }

  /**
   * Type a channel name into the input field (for "Input channel" modal)
   */
  async inputChannelName(channelName: string): Promise<void> {
    await this.channelModalInput.clear();
    await this.channelModalInput.fill(channelName);
  }

  /**
   * Open the channel dropdown and select a channel (for "Select channel" modal)
   */
  async selectChannelFromDropdown(channelName: string): Promise<void> {
    const dropdownToggle = this.channelModal.locator('[data-test="console-select-menu-toggle"]');
    await this.robustClick(dropdownToggle);

    const channelOption = this.page.locator(`[data-test-dropdown-menu="${channelName}"]`);
    await this.robustClick(channelOption);
  }

  /**
   * Click the confirm action button in the modal
   */
  async confirmAction(): Promise<void> {
    await this.robustClick(this.confirmActionButton);
    // Wait for modal to close
    // eslint-disable-next-line no-restricted-syntax
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      // Modal may close quickly, ignore timeout
    });
  }

  /**
   * Navigate to the Configuration tab
   */
  async navigateToConfigurationTab(): Promise<void> {
    await this.navigateToTab(this.configurationTab);
    await expect(this.page.locator('.loading-box__loaded').first()).toBeVisible({
      timeout: 30_000,
    });
  }

  /**
   * Navigate to Details tab, then navigate to Configuration tab
   * Common pattern for Configuration tab tests
   */
  async navigateToConfiguration(): Promise<void> {
    await this.navigateToDetails();
    await this.navigateToConfigurationTab();
  }

  /**
   * Get the channel modal input field locator
   */
  getChannelModalInput(): Locator {
    return this.channelModalInput;
  }

  /**
   * Get the channel modal locator
   */
  getChannelModal(): Locator {
    return this.channelModal;
  }

  /**
   * Navigate to the ClusterOperators tab
   */
  async navigateToClusterOperatorsTab(): Promise<void> {
    await this.navigateToTab(this.clusterOperatorsTab);
    await this.waitForLoadingComplete();
  }

  /**
   * Get the page heading locator
   */
  getPageHeading(): Locator {
    return this.pageHeading;
  }

  /**
   * Get locators for managed cluster UI elements that should be hidden
   */
  getHostedAlert(): Locator {
    return this.hostedAlert;
  }

  getUpdateButton(): Locator {
    return this.updateButton;
  }

  getUpstreamServerUrl(): Locator {
    return this.upstreamServerUrl;
  }

  getAutoscalerLink(): Locator {
    return this.autoscalerLink;
  }

  /**
   * Check if a configuration resource link exists
   */
  getConfigurationResourceLink(resourceName: string): Locator {
    return this.page.locator(
      `a[href$="/k8s/cluster/config.openshift.io~v1~${resourceName}/cluster"]`,
    );
  }

  /**
   * Open the update cluster modal
   */
  async openUpdateModal(): Promise<void> {
    const updateButton = this.page.getByTestId('cv-update-button');
    await this.robustClick(updateButton);

    // Wait for modal to appear
    await expect(this.modalTitle).toContainText('Update cluster', { timeout: 10_000 });
    await expect(this.page.getByTestId('update-cluster-modal')).toBeVisible();
  }

  /**
   * Open the update version dropdown in the update modal
   */
  async openUpdateDropdown(): Promise<void> {
    const modal = this.page.getByTestId('update-cluster-modal');
    const dropdownToggle = modal.getByTestId('dropdown-with-switch-toggle');

    await this.robustClick(dropdownToggle);
  }
}
