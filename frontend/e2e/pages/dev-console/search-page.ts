import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class SearchPage extends BasePage {
  private readonly resourceFilterInput = this.page.getByRole('combobox', {
    name: 'Type to filter',
  });
  private readonly resourceDropdownList = this.page.locator('#resource-dropdown-listbox');

  async navigateToSearch(namespace: string): Promise<void> {
    await this.goTo(`/search/ns/${namespace}`);
  }

  async navigateToTopology(namespace: string): Promise<void> {
    await this.goTo(`/topology/ns/${namespace}`);
  }

  async searchAndSelectResource(resourceName: string): Promise<void> {
    await this.resourceFilterInput.click();
    await this.resourceFilterInput.fill(resourceName);
    await this.resourceDropdownList.locator(`label[id$="${resourceName}"]`).first().click();
  }

  async openResourcesFilter(): Promise<void> {
    await this.resourceFilterInput.click();
  }

  async clearHistory(): Promise<void> {
    await this.robustClick(this.page.getByTestId('clear-history'));
  }

  getRecentlyUsedHeading(): Locator {
    return this.resourceDropdownList.getByText('Recently used');
  }

  getRecentlyUsedItem(resourceName: string): Locator {
    return this.resourceDropdownList.getByText(resourceName, { exact: true }).first();
  }
}
