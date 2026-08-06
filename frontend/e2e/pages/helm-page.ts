import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';

import BasePage from './base-page';

export class HelmPage extends BasePage {
  private readonly filtersContainer = this.page.locator(
    '[data-ouia-component-id="DataViewFilters"]',
  );
  private readonly filterDropdownButton = this.page.locator(
    '[data-ouia-component-id="DataViewCheckboxFilter"]',
  );
  private readonly filterToolbar = this.page.locator(
    '[data-ouia-component-id="DataViewToolbar"]',
  );
  private readonly nameFilterInput = this.page.locator('[aria-label="Filter by name"]');
  private readonly formRadioForm = this.page.locator('#form-radiobutton-editorType-form-field');
  private readonly formRadioYaml = this.page.locator('#form-radiobutton-editorType-yaml-field');
  private readonly yamlEditorLines = this.page.locator('div.view-lines');
  private readonly catalogSearch = this.page.locator('input[placeholder="Filter by keyword..."]');
  private readonly catalogSidePane = this.page.locator('[role="dialog"]');
  private readonly catalogSidePaneButton = this.page.getByTestId('catalog-details-modal-cta');

  // Helm release list locators
  private readonly emptyMessage = this.page.getByText('No Helm Releases found');
  private readonly installCatalogLink = this.page.getByRole('link', {
    name: /browse the catalog/i,
  });
  private readonly dataViewTable = this.page.locator('[role="grid"]');
  private readonly statusIcon = this.page.getByTestId('success-icon');
  private readonly statusText = this.page.getByTestId('status-text');
  private readonly formSection = this.page.locator('#root_field-group');
  private readonly chartVersionDropdown = this.page.locator('#form-dropdown-chartVersion-field');
  private readonly cancelButton = this.page.getByTestId('reset-button');

  // Helm tabbed page locators
  private readonly helmReleasesTab = this.page.locator(
    '[data-test-id="horizontal-link-Helm Releases"]',
  );
  private readonly repositoriesTab = this.page.locator(
    '[data-test-id="horizontal-link-Repositories"]',
  );
  private readonly createDropdownToggle = this.page.getByTestId('tab-list-page-create');
  private readonly catalogLink = this.page.getByRole('link', {
    name: 'Browse the catalog to discover available Helm Charts',
  });
  private readonly pageHeading = this.page.getByTestId('page-heading');

  // Helm Chart Repository form locators
  private readonly formTitle = this.page.getByTestId('form-title');
  private readonly releaseNameInput = this.page.locator('#form-input-releaseName-field');
  private readonly repoNameInput = this.page.locator('#form-input-formData-repoName-field');
  private readonly repoDisplayNameInput = this.page.locator(
    '#form-input-formData-repoDisplayName-field',
  );
  private readonly repoDescriptionInput = this.page.locator(
    '#form-input-formData-repoDescription-field',
  );
  private readonly repoUrlInput = this.page.locator('#form-input-formData-repoUrl-field');
  private readonly clusterScopedRadio = this.page.getByTestId('HelmChartRepository-view-input');
  private readonly submitButton = this.page.locator('[data-test-id="submit-button"]');

  // Details/list page locators
  private readonly detailsPageHeading = this.page.getByTestId('page-heading').locator('h1');
  private readonly itemFilter = this.page.getByTestId('item-filter');
  private readonly resourceRowLocator = this.page.locator('[data-test-rows="resource-row"]');
  private readonly kebabButton = this.page.locator('[data-test-id="kebab-button"]');

  async navigateToHelmReleases(namespace: string): Promise<void> {
    await this.goTo(`/helm-releases/ns/${namespace}`);
  }

  async navigateToCatalogHelmCharts(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}?catalogType=HelmChart`);
  }

  async searchAndSelectHelmChart(chartName: string): Promise<void> {
    await this.catalogSearch.fill(chartName);
    await this.page.getByTestId(`HelmChart-${chartName}`).first().click();
    await expect(this.catalogSidePane).toBeVisible();
    await this.robustClick(this.catalogSidePaneButton);
  }

  getYamlEditorLines(): Locator {
    return this.yamlEditorLines;
  }

  async selectYamlView(): Promise<void> {
    await this.formRadioYaml.click();
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async openStatusFilterDropdown(): Promise<void> {
    // Select "Status" from the filter type toggle
    const filterToggle = this.filtersContainer.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.robustClick(this.page.locator('.pf-v6-c-menu__list-item').filter({ hasText: 'Status' }));
    // Open the checkbox filter dropdown
    await this.robustClick(this.filterDropdownButton);
  }

  async selectStatusFilter(status: string): Promise<void> {
    const checkbox = this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status}"] input`,
    );
    await checkbox.check();
  }

  async verifyStatusFilterChecked(status: string): Promise<void> {
    const checkbox = this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status}"] input`,
    );
    await expect(checkbox).toBeChecked();
  }

  async selectAllStatusFilters(): Promise<void> {
    await this.selectStatusFilter('deployed');
    await this.selectStatusFilter('failed');
    await this.selectStatusFilter('other');
  }

  async verifyAllStatusFiltersChecked(): Promise<void> {
    await this.verifyStatusFilterChecked('deployed');
    await this.verifyStatusFilterChecked('failed');
    await this.verifyStatusFilterChecked('other');
  }

  async verifyAllStatusFiltersUnchecked(): Promise<void> {
    for (const status of ['deployed', 'failed', 'other']) {
      const checkbox = this.page.locator(
        `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status}"] input`,
      );
      await expect(checkbox).not.toBeChecked();
    }
  }

  async clearAllFilters(): Promise<void> {
    const clearButton = this.filterToolbar.getByRole('button', { name: 'Clear all filters' });
    if ((await clearButton.count()) > 0) {
      await this.robustClick(clearButton);
    }
  }

  async searchByName(name: string): Promise<void> {
    // Select "Name" from the filter type toggle
    const filterToggle = this.filtersContainer.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.robustClick(this.page.locator('.pf-v6-c-menu__list-item').filter({ hasText: 'Name' }));
    await this.nameFilterInput.fill(name);
  }

  getReleaseCellByName(name: string): Locator {
    return this.page.getByTestId('data-view-cell-helm-release-name').filter({ hasText: name });
  }

  // --- Helm Tabbed Page methods ---

  async navigateToHelmPage(namespace: string): Promise<void> {
    await this.goTo(`/helm/ns/${namespace}`);
  }

  async navigateToHelmRepositories(namespace: string): Promise<void> {
    await this.goTo(`/helm/ns/${namespace}/repositories`);
  }

  getHelmReleasesTab(): Locator {
    return this.helmReleasesTab;
  }

  getRepositoriesTab(): Locator {
    return this.repositoriesTab;
  }

  getCatalogLink(): Locator {
    return this.catalogLink;
  }

  getCreateDropdownToggle(): Locator {
    return this.createDropdownToggle;
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getFormTitle(): Locator {
    return this.formTitle;
  }

  async clickHelmReleasesTab(): Promise<void> {
    await this.robustClick(this.helmReleasesTab);
    await this.waitForLoadingComplete();
  }

  async clickRepositoriesTab(): Promise<void> {
    await this.robustClick(this.repositoriesTab);
    await this.waitForLoadingComplete();
  }

  async openCreateDropdown(): Promise<void> {
    await this.robustClick(this.createDropdownToggle);
  }

  async verifyCreateDropdownItems(): Promise<void> {
    const menuItems = this.page.locator('[data-test-dropdown-menu]');
    await expect(menuItems.filter({ hasText: 'Repository' })).toBeVisible();
    await expect(menuItems.filter({ hasText: 'Helm Release' })).toBeVisible();
  }

  async clickCreateMenuItem(itemText: string): Promise<void> {
    await this.openCreateDropdown();
    const menuItem = this.page.locator('[data-test-dropdown-menu]', { hasText: itemText });
    await this.robustClick(menuItem);
  }

  async clickCreateHelmRelease(): Promise<void> {
    await this.clickCreateMenuItem('Helm Release');
  }

  async clickCreateRepository(): Promise<void> {
    await this.clickCreateMenuItem('Repository');
  }

  // --- Repository form methods ---

  async fillRepoName(name: string): Promise<void> {
    await this.repoNameInput.fill(name);
  }

  async fillRepoDisplayName(displayName: string): Promise<void> {
    await this.repoDisplayNameInput.scrollIntoViewIfNeeded();
    await this.repoDisplayNameInput.fill(displayName);
  }

  async fillRepoDescription(description: string): Promise<void> {
    await this.repoDescriptionInput.scrollIntoViewIfNeeded();
    await this.repoDescriptionInput.fill(description);
  }

  async fillRepoUrl(url: string): Promise<void> {
    await this.repoUrlInput.scrollIntoViewIfNeeded();
    await this.repoUrlInput.fill(url);
  }

  async selectClusterScope(): Promise<void> {
    await this.robustClick(this.clusterScopedRadio);
  }

  async clickSubmit(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async fillReleaseName(name: string): Promise<void> {
    await this.releaseNameInput.fill(name);
  }

  // --- Details page methods ---

  getDetailsPageHeading(): Locator {
    return this.detailsPageHeading;
  }

  getKindTitle(kind: string): Locator {
    return this.page.locator(`[title="${kind}"]`);
  }

  getBreadcrumb(index: number): Locator {
    return this.page.getByTestId(`breadcrumb-link-${index}`);
  }

  async clickBreadcrumb(index: number): Promise<void> {
    await this.robustClick(this.getBreadcrumb(index));
  }

  // --- Repository list page methods ---

  async filterRepoByName(name: string): Promise<void> {
    await this.itemFilter.clear();
    await this.itemFilter.fill(name);
  }

  async editRepository(name: string, type: string): Promise<void> {
    await this.filterRepoByName(name);
    await expect(this.kebabButton.first()).toBeVisible({ timeout: 30_000 });
    await this.robustClick(this.kebabButton.first());
    const editAction = this.page.getByTestId(`Edit ${type}`);
    await this.robustClick(editAction);
  }

  async deleteRepositoryFromKebab(name: string, type: string): Promise<void> {
    await this.robustClick(this.kebabButton.first());
    const deleteAction = this.page.getByTestId(`Delete ${type}`);
    await this.robustClick(deleteAction);
    const confirmButton = this.page.getByTestId('confirm-action');
    await this.robustClick(confirmButton);
  }

  getResourceRows(): Locator {
    return this.resourceRowLocator;
  }

  async isRepositoryTabActive(): Promise<boolean> {
    const parent = this.repositoriesTab.locator('xpath=ancestor::li');
    const classAttr = await parent.getAttribute('class');
    return classAttr?.includes('pf-m-current') ?? false;
  }

  async clickRepository(repoName: string): Promise<void> {
    const repoLink = this.page.locator(`[data-test-id="${repoName}"]`);
    await this.robustClick(repoLink);
  }

  // --- Helm release list getters ---

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
    return this.formRadioForm;
  }

  getYamlViewRadio(): Locator {
    return this.formRadioYaml;
  }

  getReleaseNameInput(): Locator {
    return this.releaseNameInput;
  }

  getCancelButton(): Locator {
    return this.cancelButton;
  }

  getFormSections(): Locator {
    return this.formSection;
  }

  getFilterDropdownItem(status: string): Locator {
    return this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status.toLowerCase()}"]`,
    );
  }

  // --- Helm release list actions ---

  async clickReleaseName(name: string): Promise<void> {
    await this.robustClick(this.page.locator(`a[title="${name}"]`));
  }

  async clickKebabMenu(): Promise<void> {
    const kebabButton = this.page.getByTestId('kebab-button').first();
    await this.robustClick(kebabButton);
    // eslint-disable-next-line no-restricted-syntax
    await this.page
      .locator('[data-test-action]')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
  }

  async selectAction(actionName: string): Promise<void> {
    await this.robustClick(this.page.locator(`[data-test-action="${actionName}"]`));
  }

  async filterByStatus(status: string): Promise<void> {
    const filterToggle = this.filtersContainer.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.robustClick(this.page.locator('.pf-v6-c-menu__list-item').filter({ hasText: 'Status' }));
    await this.robustClick(this.filterDropdownButton);
    const filterItem = this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status.toLowerCase()}"]`,
    );
    await this.robustClick(filterItem);
    await this.robustClick(this.filterDropdownButton);
  }

  // --- Catalog navigation ---

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
    await this.robustClick(this.catalogSidePaneButton, { force: true });
  }

  async enterReleaseName(name: string): Promise<void> {
    await this.releaseNameInput.clear();
    await this.releaseNameInput.fill(name);
  }

  async clickInstallButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    await this.waitForLoadingComplete(40_000);
  }

  // --- Upgrade/Rollback actions ---

  async upgradeChartVersion(): Promise<void> {
    await this.chartVersionDropdown.click();
    const items = this.page.getByTestId('console-select-item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await items.first().click();
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
    await this.waitForLoadingComplete(60_000);
  }

  async selectRevision(): Promise<void> {
    await this.page.locator('[id^=form-radiobutton-revision]').last().check();
  }

  async clickRollbackButton(): Promise<void> {
    await this.robustClick(this.submitButton);
    await this.waitForLoadingComplete(60_000);
  }
}
