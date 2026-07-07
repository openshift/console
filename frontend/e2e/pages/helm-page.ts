import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class HelmPage extends BasePage {
  private readonly emptyMessage = this.page.getByText('No Helm Releases found');
  private readonly installCatalogLink = this.page.getByRole('link', {
    name: /browse the catalog/i,
  });
  private readonly dataViewTable = this.page.locator('[role="grid"]');
  private readonly dataViewFilters = this.page.getByTestId('data-view-filters');
  private readonly filterDropdown = this.page.locator(
    '[data-ouia-component-id="DataViewCheckboxFilter"]',
  );
  private readonly nameFilterInput = this.page.getByRole('textbox', { name: 'Filter by name' });
  private readonly statusIcon = this.page.getByTestId('success-icon');
  private readonly statusText = this.page.getByTestId('status-text');
  private readonly catalogSearch = this.page.getByPlaceholder('Filter by keyword...');
  private readonly catalogSidePane = this.page.locator('[role="dialog"]');
  private readonly releaseNameInput = this.page.locator('#form-input-releaseName-field');
  private readonly submitButton = this.page.getByTestId('save-changes');
  private readonly cancelButton = this.page.getByTestId('reset-button');
  private readonly formTitle = this.page.getByTestId('form-title');
  private readonly formSection = this.page.locator('#root_field-group')
  private readonly formViewRadio = this.page.locator('#form-radiobutton-editorType-form-field');
  private readonly yamlViewRadio = this.page.locator('#form-radiobutton-editorType-yaml-field');
  private readonly chartVersionDropdown = this.page.locator('#form-dropdown-chartVersion-field');

  async navigateToHelmReleases(namespace: string): Promise<void> {
    await this.goTo(`/helm/ns/${namespace}`);
  }

  async searchByName(name: string): Promise<void> {
    const filterToggle = this.dataViewFilters.getByRole('button');
    await this.robustClick(filterToggle, { timeout: 60_000 });
    await this.page.getByRole('menuitem', { name: 'Name' }).click();
    await this.nameFilterInput.fill(name);
  }

  async filterByStatus(status: string): Promise<void> {
    const filterToggle = this.dataViewFilters.getByRole('button');
    await this.robustClick(filterToggle);
    await this.page.getByRole('menuitem', { name: 'Status' }).click();
    await this.robustClick(this.filterDropdown);
    const filterItem = this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status.toLowerCase()}"]`,
    );
    await this.robustClick(filterItem);
    await this.robustClick(this.filterDropdown);
  }

  async clickReleaseName(name: string): Promise<void> {
    await this.robustClick(this.page.locator(`a[title="${name}"]`));
  }

  async clickKebabMenu(): Promise<void> {
    const kebabButton = this.page.getByTestId('kebab-button').first();
    await this.robustClick(kebabButton);
    // Wait for the dropdown menu to appear after clicking
    // eslint-disable-next-line no-restricted-syntax
    await this.page.locator('[data-test-action]').first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async selectAction(actionName: string): Promise<void> {
    await this.robustClick(this.page.locator(`[data-test-action="${actionName}"]`));
  }

  async navigateToCatalog(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}`);
  }

  async selectHelmChartsType(): Promise<void> {
    await this.robustClick(this.page.getByTestId('tab HelmChart'));
  }

  async searchAndSelectChart(chartName: string): Promise<void> {
    await this.catalogSearch.fill(chartName);
    await this.robustClick(this.page.getByTestId(`HelmChart-${chartName}`).first());
  }

  async clickCreateOnSidePane(): Promise<void> {
    await this.robustClick(this.catalogSidePane.locator('[role="button"]'), { force: true });
  }

  async enterReleaseName(name: string): Promise<void> {
    await this.releaseNameInput.clear();
    await this.releaseNameInput.fill(name);
  }

  async clickInstallButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.submitButton.waitFor({ state: "visible" });
    await this.waitForLoadingComplete(40_000);
  }

  async upgradeChartVersion(): Promise<void> {
    await this.chartVersionDropdown.click();
    const items = this.page.getByTestId('console-select-item');
    const count = await items.count();
    if (count > 0) {
      await items.first().click();
    }
    const confirmButton = this.page.getByRole('button', { name: 'Proceed' });
    try {
      // eslint-disable-next-line no-restricted-syntax
      await confirmButton.waitFor({ state: 'visible', timeout: 2_000 });
      await this.robustClick(confirmButton);
    } catch {
      // Confirmation not required for this chart version
    }
  }

  async clickUpgradeButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.submitButton.waitFor({ state: "visible", timeout: 1_000 });
    await this.waitForLoadingComplete(60_000);
  }

  async selectRevision(): Promise<void> {
    await this.page.locator('[id^=form-radiobutton-revision]').last().check();
  }

  async clickRollbackButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.submitButton.waitFor({ state: "visible", timeout: 2_000 });
    await this.waitForLoadingComplete(60_000);
  }

  getEmptyMessage(): Locator {
    return this.emptyMessage;
  }

  getInstallLink(): Locator {
    return this.installCatalogLink;
  }

  getTable(): Locator {
    return this.dataViewTable;
  }

  getStatusIcon(): Locator {
    return this.statusIcon;
  }

  getStatusText(): Locator {
    return this.statusText;
  }

  getFormViewRadio(): Locator {
    return this.formViewRadio;
  }

  getYamlViewRadio(): Locator {
    return this.yamlViewRadio;
  }

  getReleaseNameInput(): Locator {
    return this.releaseNameInput;
  }

  getCancelButton(): Locator {
    return this.cancelButton;
  }

  getFormTitle(): Locator {
    return this.formTitle;
  }

  getFormSections(): Locator {
    return this.formSection;
  }

  getFilterDropdownItem(status: string): Locator {
    return this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status.toLowerCase()}"]`,
    );
  }
}
