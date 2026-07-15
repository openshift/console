import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class QuickStartsPage extends BasePage {
  private readonly filterInput = this.page.getByPlaceholder('Filter by keyword...');

  async navigateToCatalog(): Promise<void> {
    await this.goTo('/quickstart');
  }

  async navigateToQuickStart(name: string): Promise<void> {
    await this.goTo(`/quickstart?quickstart=${name}`);
  }

  async filterByKeyword(keyword: string): Promise<void> {
    await this.filterInput.fill(keyword);
  }

  getFilterInput(): Locator {
    return this.filterInput;
  }

  getStatusFilterToggle(): Locator {
    return this.page.getByRole('button', { name: 'Status', exact: true });
  }

  getQuickStartCard(name: string): Locator {
    // HTML id from @patternfly/quickstarts QuickStartTile — no data-test available
    return this.page.locator(`#${name}-catalog-tile`);
  }

  getPageTitle(): Locator {
    return this.page.getByTestId('page-heading');
  }

  getEmptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No results found' });
  }

  getClearFilterButton(): Locator {
    return this.page.getByRole('button', { name: 'Clear all filters' });
  }

  getDrawer(): Locator {
    return this.page.getByTestId('quickstart drawer');
  }

  getDrawerPanel(): Locator {
    return this.getDrawer().getByRole('region');
  }

  async openStatusFilter(): Promise<void> {
    await this.robustClick(this.getStatusFilterToggle());
  }

  getStatusOption(status: string): Locator {
    return this.page.getByRole('menuitem', { name: new RegExp(status) });
  }
}
