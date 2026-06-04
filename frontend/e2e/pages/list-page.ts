import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ListPage extends BasePage {
  private readonly dataViewTable = this.page.getByTestId('data-view-table');
  private readonly nameFilterInput = this.page.getByRole('textbox', { name: 'Filter by name' });
  private readonly dataViewFilters = this.page.locator(
    '[data-ouia-component-id="DataViewFilters"]',
  );
  private readonly namespaceDropdown = this.page.getByTestId('namespace-bar-dropdown');

  async waitForListLoad(): Promise<void> {
    await this.dataViewTable.or(this.page.getByTestId('page-heading')).first().waitFor({
      state: 'visible',
    });
  }

  async filterByName(name: string): Promise<void> {
    await this.dataViewFilters.waitFor({ state: 'visible', timeout: 60_000 });
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.page.locator('.pf-v6-c-menu__list-item', { hasText: 'Name' }).click();
    await this.nameFilterInput.waitFor({ state: 'visible' });
    await this.nameFilterInput.fill(name);
  }

  getCell(resourceName: string, cellName = 'name'): Locator {
    return this.page.getByTestId(`data-view-cell-${resourceName}-${cellName}`);
  }

  async clickRowByName(resourceName: string): Promise<void> {
    const link = this.getCell(resourceName).locator('a').first();
    await this.robustClick(link);
  }

  async filterByCheckbox(filterName: string, checkboxLabel: string): Promise<void> {
    await this.dataViewFilters.waitFor({ state: 'visible', timeout: 60_000 });
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

  async selectProject(projectName: string): Promise<void> {
    const dropdownButton = this.namespaceDropdown.getByRole('button');
    await this.robustClick(dropdownButton);
    const searchInput = this.page.getByRole('searchbox', { name: 'Select project...' });
    await searchInput.fill(projectName);
    const item = this.page.getByRole('menuitem', { name: projectName, exact: true });
    await this.robustClick(item);
    await this.waitForLoadingComplete();
  }
}
