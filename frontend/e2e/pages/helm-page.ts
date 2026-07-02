import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class HelmPage extends BasePage {
  private readonly emptyMessage = this.page.getByText('No Helm Releases found');
  private readonly installCatalogLink = this.page.getByRole('link', {
    name: /browse the catalog/i,
  });
  private readonly dataViewTable = this.page.locator('[role="grid"]');
  private readonly dataViewFilters = this.page.locator(
    '[data-ouia-component-id="DataViewFilters"]',
  );
  private readonly filterDropdown = this.page.locator(
    '[data-ouia-component-id="DataViewCheckboxFilter"]',
  );
  private readonly nameFilterInput = this.page.getByRole('textbox', { name: 'Filter by name' });
  private readonly statusIcon = this.page.getByTestId('success-icon');
  private readonly statusText = this.page.getByTestId('status-text');
  private readonly catalogSearch = this.page.getByPlaceholder('Filter by keyword...');
  private readonly catalogSidePane = this.page.locator('[role="dialog"]');
  private readonly releaseNameInput = this.page.locator('#form-input-releaseName-field');
  private readonly submitButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly cancelButton = this.page.locator('[data-test-id="reset-button"]');
  private readonly formViewRadio = this.page.locator('#form-radiobutton-editorType-form-field');
  private readonly yamlViewRadio = this.page.locator('#form-radiobutton-editorType-yaml-field');
  private readonly chartVersionDropdown = this.page.locator('#form-dropdown-chartVersion-field');

  async navigateToHelmReleases(namespace: string): Promise<void> {
    await this.goTo(`/helm/ns/${namespace}`);
  }

  async searchByName(name: string): Promise<void> {
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle, { timeout: 60_000 });
    await this.page.locator('.pf-v6-c-menu__list-item', { hasText: 'Name' }).click();
    await this.nameFilterInput.fill(name);
  }

  async filterByStatus(status: string): Promise<void> {
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.page.locator('.pf-v6-c-menu__list-item', { hasText: 'Status' }).click();
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
    const kebabButton = this.page.locator('[data-test-id="kebab-button"]').first();
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
    await this.page.locator('.pf-v6-c-button__progress').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
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
      await confirmButton.waitFor({ state: 'visible', timeout: 3_000 });
      await this.robustClick(confirmButton);
    } catch {
      // Confirmation not required for this chart version
    }
  }

  async clickUpgradeButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.page.locator('.pf-v6-c-button__progress').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
  }

  async selectRevision(): Promise<void> {
    await this.page.locator('[id^=form-radiobutton-revision]').last().check();
  }

  async clickRollbackButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.page.locator('.pf-v6-c-button__progress').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
    await this.waitForLoadingComplete(60_000);
  }

  async selectProject(namespace: string): Promise<void> {
    const namespaceDropdown = this.page.getByTestId('namespace-bar-dropdown');
    const dropdownButton = namespaceDropdown.getByRole('button');
    await this.robustClick(dropdownButton);

    const searchInput = this.page.getByRole('searchbox', { name: 'Select project...' });
    // eslint-disable-next-line no-restricted-syntax
    await searchInput.waitFor({ state: 'visible' });

    const systemSwitch = this.page.getByTestId('showSystemSwitch');
    if ((await systemSwitch.count()) > 0 && !(await systemSwitch.isChecked())) {
      await systemSwitch.check();
    }

    await searchInput.fill(namespace);
    const item = this.page.getByRole('menuitem', { name: namespace, exact: true });
    await this.robustClick(item);
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

  getFilterDropdownItem(status: string): Locator {
    return this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status.toLowerCase()}"]`,
    );
  }
}
