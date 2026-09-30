import type { Locator } from '@playwright/test';

import BasePage from './base-page';

/**
 * The project/namespace selector bar rendered above most resource pages, plus the
 * default-namespace security warning the bar renders underneath itself.
 */
export class NamespaceBarPage extends BasePage {
  private readonly namespaceBarDropdown = this.page.getByTestId('namespace-bar-dropdown');
  private readonly dropdownMenu = this.page.getByTestId('namespace-dropdown-menu');
  private readonly dropdownFilter = this.page.getByTestId('dropdown-text-filter');
  private readonly showDefaultsSwitch = this.page.getByTestId('showSystemSwitch');
  private readonly warningAlert = this.page.getByTestId('default-namespace-warning-alert');

  async navigateTo(url: string): Promise<void> {
    await this.goTo(url);
  }

  getWarningAlert(): Locator {
    return this.warningAlert;
  }

  getDropdownMenu(): Locator {
    return this.dropdownMenu;
  }

  /** "Default" labels rendered next to system namespaces in the open dropdown. */
  getDefaultLabels(): Locator {
    return this.dropdownMenu.getByTestId('default-namespace-label');
  }

  getMenuItems(): Locator {
    return this.dropdownMenu.getByTestId('dropdown-menu-item-link');
  }

  async openDropdown(): Promise<void> {
    await this.robustClick(this.namespaceBarDropdown.getByRole('button'));
    // eslint-disable-next-line no-restricted-syntax -- waiting for the menu to render, no action follows
    await this.dropdownMenu.waitFor({ state: 'visible' });
  }

  /** The dropdown hides system namespaces behind a toggle; turn it on. */
  async showDefaultNamespaces(): Promise<void> {
    if (!(await this.showDefaultsSwitch.isChecked())) {
      await this.showDefaultsSwitch.check();
    }
  }

  async filterDropdown(text: string): Promise<void> {
    await this.dropdownFilter.fill(text);
  }
}
