import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ListPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading').locator('h1');
  private readonly dataViewTable: Locator = this.page.getByTestId('data-view-table');
  private readonly dataViewCells: Locator = this.page.locator('[data-test^="data-view-cell-"]');
  private readonly dataViewFilters: Locator = this.page.locator(
    '[data-ouia-component-id="DataViewFilters"]',
  );
  private readonly nameFilterInput: Locator = this.page.getByLabel('Filter by name');
  private readonly singleFilterGroup: Locator = this.page.locator(
    '.co-console-data-view-single-filter .pf-v6-c-toolbar__group.pf-m-filter-group',
  );

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
      await this.dataViewTable.waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      await this.retryOnError();
      await this.dataViewTable.waitFor({ state: 'visible', timeout: 30_000 });
    }
  }

  async filterByName(name: string): Promise<void> {
    const filterToggle = this.dataViewFilters.locator('.pf-v6-c-menu-toggle').first();
    await this.robustClick(filterToggle);
    await this.robustClick(this.page.locator('.pf-v6-c-menu__list-item', { hasText: 'Name' }));
    await this.nameFilterInput.waitFor({ state: 'visible' });
    await this.nameFilterInput.fill(name);
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
}
