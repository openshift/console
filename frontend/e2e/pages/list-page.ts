import { type Locator, expect } from '@playwright/test';

import BasePage from './base-page';

export class ListPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading').locator('h1');
  private readonly dataViewTable: Locator = this.page.getByTestId('data-view-table');
  private readonly dataViewCells: Locator = this.page.locator('[data-test^="data-view-cell-"]');
  private readonly nameFilterInput = this.page.getByRole('textbox', { name: 'Filter by name' });
  private readonly dataViewFilters = this.page.locator(
    '[data-ouia-component-id="DataViewFilters"]',
  );
  private readonly singleFilterGroup: Locator = this.page.locator(
    '.co-console-data-view-single-filter .pf-v6-c-toolbar__group.pf-m-filter-group',
  );
  private readonly namespaceDropdown = this.page.getByTestId('namespace-bar-dropdown');
  private readonly resourceRows = this.page.getByTestId('resource-row');
  private readonly nameFilter = this.page.getByTestId('name-filter-input');
  private readonly createButton = this.page.getByTestId('item-create');

  get heading(): Locator {
    return this.pageHeading;
  }

  get table(): Locator {
    return this.dataViewTable;
  }

  get cells(): Locator {
    return this.dataViewCells;
  }

  get filterGroupToggles(): Locator {
    return this.singleFilterGroup.locator('.pf-v6-c-menu-toggle');
  }

  cell(resourceName: string, cellName = 'name'): Locator {
    return this.page.getByTestId(`data-view-cell-${resourceName}-${cellName}`);
  }

  resourceLink(name: string): Locator {
    return this.page.getByTestId(name);
  }

  async waitForRows(): Promise<void> {
    try {
      await expect(this.dataViewTable).toBeVisible({ timeout: 15_000 });
    } catch {
      await this.retryOnError();
      await expect(this.dataViewTable).toBeVisible({ timeout: 30_000 });
    }
  }

  async filterByName(name: string): Promise<void> {
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle, { timeout: 60_000 });
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
    const dataViewLink = this.getCell(resourceName).locator('a').first();
    const standardLink = this.page.getByTestId(resourceName);
    await this.robustClick(dataViewLink.or(standardLink).first());
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
    const dataViewCell = this.getCell(resourceName);
    const standardCell = this.page.getByTestId(resourceName);
    const cell = dataViewCell.or(standardCell).first();
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
    const dataViewToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    const standardToggle = this.page.getByTestId('filter-dropdown-toggle').locator('button');
    const toggle = dataViewToggle.or(standardToggle).first();
    await this.robustClick(toggle);

    if (await this.dataViewFilters.isVisible()) {
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
    } else {
      const filterItem = this.page.locator(`[data-test-row-filter="${checkboxLabel}"]`);
      await this.robustClick(filterItem);
    }
  }

  async clickFirstRowLink(): Promise<void> {
    const firstLink = this.dataViewCells.first().locator('a').first();
    await this.robustClick(firstLink);
  }

  async clickFirstRowLinkMatching(pattern: RegExp): Promise<void> {
    const safeFlags = pattern.flags.replace(/[gy]/g, '');
    const safePattern = new RegExp(pattern.source, safeFlags);
    const links = this.dataViewCells.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      if (text && safePattern.test(text)) {
        await this.robustClick(links.nth(i));
        return;
      }
    }
    throw new Error(`No row link matching ${pattern} found`);
  }

  async getFirstCellText(): Promise<string> {
    const link = this.page.locator('[data-test^="data-view-cell-"]').first().locator('a').first();
    return (await link.textContent()) ?? '';
  }

  async selectProject(projectName: string): Promise<void> {
    const dropdownButton = this.namespaceDropdown.getByRole('button');
    await this.robustClick(dropdownButton);

    const searchInput = this.page.getByRole('searchbox', { name: 'Select project...' });
    // eslint-disable-next-line no-restricted-syntax
    await searchInput.waitFor({ state: 'visible' });

    const systemSwitch = this.page.getByTestId('showSystemSwitch');
    if ((await systemSwitch.count()) > 0 && !(await systemSwitch.isChecked())) {
      await systemSwitch.check();
    }

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

  async createProject(projectName: string): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: 'Create Project' }));
    await expect(this.page.locator('h1', { hasText: 'Create Project' })).toBeVisible({
      timeout: 20_000,
    });
    await this.page.getByTestId('input-name').fill(projectName);
    await this.robustClick(this.page.getByRole('button', { name: 'Create', exact: true }));
  }
}
