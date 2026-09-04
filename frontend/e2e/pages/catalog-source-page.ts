import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class CatalogSourcePage extends BasePage {
  private readonly configurationTab = this.page.getByTestId('horizontal-link-Configuration');
  private readonly sourcesTab = this.page.getByTestId('horizontal-link-Sources');
  private readonly operatorsTab = this.page.getByTestId('horizontal-link-Operators');

  private readonly packageManifestTable = this.page.getByTestId('PackageManifestTable');

  private readonly registryPollIntervalDropdown = this.page.getByTestId(
    'registry-poll-interval-dropdown',
  );
  private readonly registryPollIntervalModalTitle = this.page.getByTestId(
    'registry-poll-interval-modal-title',
  );

  async navigateToOperatorHubSources(): Promise<void> {
    await this.goTo('/settings/cluster');
    await this.navigateToTab(this.configurationTab);
    await this.waitForLoadingComplete();
    const operatorHubLink = this.page.getByTestId('OperatorHub');
    await operatorHubLink.scrollIntoViewIfNeeded();
    await this.robustClick(operatorHubLink);
    await this.navigateToTab(this.sourcesTab);
  }

  // The OperatorHub "Sources" tab list is scoped to the currently active project, which is
  // unreliable for a CatalogSource created in a one-off test namespace. Navigate to its details
  // page directly instead of locating it via that tab.
  async navigateToDetails(namespace: string, name: string): Promise<void> {
    await this.goTo(
      `/k8s/ns/${namespace}/operators.coreos.com~v1alpha1~CatalogSource/${name}`,
    );
  }

  async openCatalogSourceDetails(name: string): Promise<void> {
    await this.robustClick(this.page.getByTestId(name));
  }

  getSectionHeading(text: string): Locator {
    return this.page.getByTestId(`section-heading-${text}`);
  }

  getDetailsLabel(label: string): Locator {
    return this.page.getByTestId(`details-item-label__${label}`);
  }

  getDetailsValue(label: string): Locator {
    return this.page.getByTestId(`details-item-value__${label}`);
  }

  getPackageManifestTable(): Locator {
    return this.packageManifestTable;
  }

  getRegistryPollIntervalModalTitle(): Locator {
    return this.registryPollIntervalModalTitle;
  }

  async selectOperatorsTab(): Promise<void> {
    await this.navigateToTab(this.operatorsTab);
  }

  async clickEditRegistryPollInterval(): Promise<void> {
    const editButton = this.page.getByTestId(
      'Registry poll interval-details-item__edit-button',
    );
    await this.robustClick(editButton);
  }

  async selectPollInterval(interval: string): Promise<void> {
    await this.robustClick(this.registryPollIntervalDropdown);
    await this.robustClick(this.page.getByTestId(`dropdown-menu-${interval}`));
  }

  async submitPollIntervalModal(): Promise<void> {
    await this.robustClick(this.page.getByTestId('confirm-action'));
  }
}
