import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ListPage extends BasePage {
  private readonly heading = this.page.locator('[data-test="page-heading"] h1');

  async titleShouldHaveText(title: string): Promise<void> {
    await expect(this.heading).toContainText(title);
  }

  // --- Resource row helpers (older VirtualizedTable) ---

  async rowsShouldExist(resourceName: string): Promise<void> {
    await expect(this.page.locator(`[data-test-id="${resourceName}"]`)).toBeVisible({
      timeout: 60_000,
    });
  }

  async rowsShouldNotExist(resourceName: string): Promise<void> {
    await expect(this.page.locator(`[data-test-id="${resourceName}"]`)).toBeHidden({
      timeout: 90_000,
    });
  }

  async rowsClickKebabAction(resourceName: string, actionName: string): Promise<void> {
    const row = this.page
      .locator('[data-test-rows="resource-row"]')
      .filter({ hasText: resourceName });
    const kebab = row.locator('[data-test-id="kebab-button"]');
    await this.robustClick(kebab);
    const action = this.page.locator(`[data-test-action="${actionName}"]:not([disabled])`);
    await this.robustClick(action);
  }

  async rowsClickStatusButton(resourceName: string): Promise<void> {
    const row = this.page
      .locator('[data-test-rows="resource-row"]')
      .filter({ hasText: resourceName });
    const statusButton = row.getByTestId('popover-status-button');
    await this.robustClick(statusButton, { timeout: 60_000 });
  }

  async filterByStatus(status: string): Promise<void> {
    const filterToggle = this.page.locator('[data-ouia-component-id="DataViewCheckboxFilter"]');
    if (await filterToggle.isVisible().catch(() => false)) {
      await this.robustClick(filterToggle);
      const filterItem = this.page.locator(
        `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${status}"]`,
      );
      await this.robustClick(filterItem);
      await this.robustClick(filterToggle);
    } else {
      const filterDropdownToggle = this.page.locator(
        '[data-test-id="filter-dropdown-toggle"] button',
      );
      if (await filterDropdownToggle.isVisible().catch(() => false)) {
        await this.robustClick(filterDropdownToggle);
        await this.page.locator(`[id="${status}"]`).click();
        await this.robustClick(filterDropdownToggle);
      } else {
        await this.dvFilterBy('Status', status);
      }
    }
  }

  // --- DataView row helpers (ConsoleDataView) ---
  // These use generic table locators that work even if data-test attributes
  // are not forwarded to the DOM by PatternFly DataView components.

  private dvCell(resourceName: string, cellName = 'name'): Locator {
    return this.page.locator(`[data-test="data-view-cell-${resourceName}-${cellName}"]`);
  }

  private dvRow(resourceName: string): Locator {
    return this.page.locator('table tbody tr').filter({
      has: this.page.getByRole('link', { name: resourceName, exact: true }),
    });
  }

  async dvRowsShouldBeLoaded(): Promise<void> {
    await this.reloadIfModelNotFound();
    await expect(this.page.getByTestId('data-view-table')).toBeVisible({ timeout: 60_000 });
  }

  private async resolveRow(resourceName: string): Promise<Locator> {
    const cell = this.dvCell(resourceName);
    if (await cell.isVisible({ timeout: 5_000 }).catch(() => false)) {
      return cell.locator('xpath=ancestor::tr');
    }
    return this.dvRow(resourceName);
  }

  async dvRowsShouldExist(resourceName: string, cellName = 'name'): Promise<void> {
    const cell = this.dvCell(resourceName, cellName);
    const row = this.dvRow(resourceName);
    try {
      await expect(cell).toBeVisible({ timeout: 30_000 });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      try {
        await expect(cell).toBeVisible({ timeout: 30_000 });
      } catch {
        await expect(row).toBeVisible({ timeout: 30_000 });
      }
    }
  }

  async dvRowsShouldNotExist(resourceName: string): Promise<void> {
    const cell = this.dvCell(resourceName);
    const row = this.dvRow(resourceName);
    await expect(cell).toBeHidden({ timeout: 90_000 });
    await expect(row).toBeHidden({ timeout: 10_000 });
  }

  async dvRowsCountShouldBe(count: number): Promise<void> {
    await expect(this.page.locator('table tbody tr')).toHaveCount(count, { timeout: 60_000 });
  }

  async dvRowsClickKebabAction(resourceName: string, actionName: string): Promise<void> {
    const row = await this.resolveRow(resourceName);
    const kebab = row.locator('[data-test-id="kebab-button"]');
    await this.robustClick(kebab);
    const action = this.page.locator(`[data-test-action="${actionName}"]:not([disabled])`);
    await this.robustClick(action);
  }

  async dvRowsClickStatusButton(resourceName: string): Promise<void> {
    const row = await this.resolveRow(resourceName);
    const statusButton = row.getByTestId('popover-status-button');
    await this.robustClick(statusButton, { timeout: 60_000 });
  }

  async dvFilterByName(name: string): Promise<void> {
    const filters = this.page.locator('[data-ouia-component-id="DataViewFilters"]');
    await this.robustClick(filters.locator('.pf-v6-c-menu-toggle').first());
    await this.robustClick(
      this.page.locator('.pf-v6-c-menu__list-item').filter({ hasText: 'Name' }),
    );
    const input = this.page.locator('[aria-label="Filter by name"]');
    await input.clear();
    await input.fill(name);
  }

  async dvFilterBy(filterName: string, checkboxLabel: string): Promise<void> {
    await this.dvRowsShouldBeLoaded();
    const filters = this.page.locator('[data-ouia-component-id="DataViewFilters"]');
    await this.robustClick(filters.locator('.pf-v6-c-menu-toggle').first());
    await this.robustClick(
      this.page.locator('.pf-v6-c-menu__list-item').filter({ hasText: filterName }),
    );
    await this.robustClick(this.page.locator('[data-ouia-component-id="DataViewCheckboxFilter"]'));
    const filterItem = this.page.locator(
      `[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${checkboxLabel}"]`,
    );
    await expect(filterItem).toBeVisible();
    await this.robustClick(filterItem);
    await expect(this.page).toHaveURL(new RegExp(`=${checkboxLabel}`), { timeout: 10_000 });
    await this.robustClick(this.page.locator('[data-ouia-component-id="DataViewCheckboxFilter"]'));
  }

  get createYAMLButton(): Locator {
    return this.page.getByTestId('item-create');
  }
}
