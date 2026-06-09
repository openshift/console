import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ListPage extends BasePage {
  private readonly dataViewTable = this.page.getByTestId('data-view-table');
  private readonly nameFilterInput = this.page.getByRole('textbox', { name: 'Filter by name' });
  private readonly dataViewFilters = this.page.locator(
    '[data-ouia-component-id="DataViewFilters"]',
  );
  private readonly namespaceDropdown = this.page.getByTestId('namespace-bar-dropdown');
  private readonly resourceRows = this.page.getByTestId('resource-row');
  private readonly nameFilter = this.page.getByTestId('name-filter-input');
  private readonly createButton = this.page.getByTestId('item-create');

  async filterByName(name: string): Promise<void> {
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.page.locator('.pf-v6-c-menu__list-item', { hasText: 'Name' }).click();
    await this.nameFilterInput.fill(name);
  }

  async filterByNameInput(name: string): Promise<void> {
    await this.nameFilter.fill(name);
  }

  getCell(resourceName: string, cellName = 'name'): Locator {
    return this.page.getByTestId(`data-view-cell-${resourceName}-${cellName}`);
  }

  async clickRowByName(resourceName: string): Promise<void> {
    const link = this.getCell(resourceName).locator('a').first();
    await this.robustClick(link);
  }

  async clickRowByResourceName(resourceName: string): Promise<void> {
    await this.robustClick(this.page.getByTestId(resourceName));
  }

  getNamespaceDropdown(): Locator {
    return this.namespaceDropdown;
  }

  getDataViewTable(): Locator {
    return this.dataViewTable;
  }

  getResourceRows(): Locator {
    return this.resourceRows;
  }

  getCreateButton(): Locator {
    return this.createButton;
  }

  async clickCreateButton(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async clickCreateDropdownItem(itemName: string): Promise<void> {
    await this.robustClick(this.createButton);
    await this.page.getByRole('menuitem', { name: itemName }).click();
  }

  async clickCreateYAMLDropdownButton(): Promise<void> {
    await this.robustClick(this.createButton);
    const yamlMenuItem = this.page.getByTestId('dropdown-menu-yaml');
    if ((await yamlMenuItem.count()) > 0) {
      await this.robustClick(yamlMenuItem);
    }
  }

  async clickKebabAction(resourceName: string, actionName: string): Promise<void> {
    const cell = this.getCell(resourceName);
    const row = cell.locator('xpath=ancestor::tr');
    const kebab = row.getByTestId('kebab-button');
    await this.robustClick(kebab);
    await this.robustClick(this.page.getByTestId(actionName));
  }

  async clickResourceRowKebabAction(resourceName: string, actionName: string): Promise<void> {
    const row = this.resourceRows
      .filter({ hasText: resourceName })
      .first();
    const kebab = row.getByTestId('kebab-button');
    await this.robustClick(kebab);
    await this.robustClick(this.page.getByTestId(actionName));
  }

  async filterByCheckbox(filterName: string, checkboxLabel: string): Promise<void> {
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.page.locator('.pf-v6-c-menu__list-item', { hasText: filterName }).click();
    const checkboxFilter = this.page.locator(
      '[data-ouia-component-id="DataViewCheckboxFilter"]',
    );
    await this.robustClick(checkboxFilter);
    const filterItem = this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${checkboxLabel}"]`,
    );
    await this.robustClick(filterItem);
    await this.robustClick(checkboxFilter);
  }

  async clickFirstLinkInFirstRow(): Promise<void> {
    const link = this.page.locator('[data-test^="data-view-cell-"]').first().locator('a').first();
    await this.robustClick(link);
  }

  async getFirstCellText(): Promise<string> {
    const link = this.page.locator('[data-test^="data-view-cell-"]').first().locator('a').first();
    return (await link.textContent()) ?? '';
  }

  async selectProject(projectName: string): Promise<void> {
    const dropdownButton = this.namespaceDropdown.getByRole('button');
    await this.robustClick(dropdownButton);

    const systemSwitch = this.page.getByTestId('showSystemSwitch');
    if ((await systemSwitch.count()) > 0 && !(await systemSwitch.isChecked())) {
      await systemSwitch.check();
    }

    const searchInput = this.page.getByRole('searchbox', { name: 'Select project...' });
    await searchInput.fill(projectName);
    const item = this.page.getByRole('menuitem', { name: projectName, exact: true });
    await this.robustClick(item);
  }

  async selectAllProjects(): Promise<void> {
    const dropdownButton = this.namespaceDropdown.getByRole('button');
    await this.robustClick(dropdownButton);
    const item = this.page.getByRole('menuitem', { name: 'All Projects', exact: true });
    await this.robustClick(item);
  }
}
