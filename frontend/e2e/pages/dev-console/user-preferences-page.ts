import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class UserPreferencesPage extends BasePage {
  private readonly userMenuToggle = this.page.locator('[data-test="user-dropdown-toggle"]');
  private readonly perspectiveSwitcherToggle = this.page.locator(
    '[data-test-id="perspective-switcher-toggle"]',
  );

  constructor(page: Page) {
    super(page);
  }

  async openUserPreferences(): Promise<void> {
    await this.robustClick(this.userMenuToggle);
    const menuItem = this.page.locator('[role="menu"] li').filter({ hasText: 'User Preferences' });
    await this.robustClick(menuItem);
    await this.waitForLoadingComplete();
  }

  async expectTabVisible(tabName: string): Promise<void> {
    const tab = this.page.locator(`[data-test~="tab"][data-test~="${tabName.toLowerCase()}"]`);
    await expect(tab).toBeVisible();
  }

  async clickTab(tabName: string): Promise<void> {
    const tab = this.page.locator(`[data-test~="tab"][data-test~="${tabName.toLowerCase()}"]`);
    await this.robustClick(tab);
  }

  private getPreferenceDropdownId(preference: string): string {
    switch (preference) {
      case 'Perspective':
        return 'console.preferredPerspective';
      case 'Project':
        return 'console.preferredNamespace';
      case 'Topology':
        return 'topology.preferredView';
      case 'Create/Edit resource method':
        return 'console.preferredCreateEditMethod';
      case 'Language':
        return 'console.preferredLanguage';
      case 'Resource Type':
        return 'devconsole.preferredResource';
      default:
        throw new Error(`Unknown preference: ${preference}`);
    }
  }

  async changePreferenceDropdown(preference: string, value: string): Promise<void> {
    const dropdownId = this.getPreferenceDropdownId(preference);
    const dropdown = this.page.locator(`[id="${dropdownId}"]`);
    await this.robustClick(dropdown);
    const option = this.page
      .locator('[role="option"], [role="menuitem"]')
      .filter({ hasText: value });
    await this.robustClick(option);
  }

  async reloadConsole(): Promise<void> {
    await this.page.reload();
    await this.waitForLoadingComplete();
  }

  async expectPerspective(perspectiveName: string): Promise<void> {
    await expect(this.perspectiveSwitcherToggle).toContainText(perspectiveName);
  }

  async expectTopologyGraphView(): Promise<void> {
    await expect(this.page.locator('[data-id="odc-topology-graph"]')).toBeVisible();
  }

  async expectTopologyListView(): Promise<void> {
    await expect(this.page.locator('[aria-label="Topology List View"]')).toBeVisible();
  }

  async expectYamlViewSelected(): Promise<void> {
    await expect(this.page.locator('#form-radiobutton-editorType-yaml-field')).toBeChecked();
  }

  async expectResourceTypeSelected(resourceType: string): Promise<void> {
    const dropdown = this.page.locator('[data-test-id="dropdown-button"]').filter({
      hasText: resourceType,
    });
    await expect(dropdown.first()).toBeVisible();
  }
}
