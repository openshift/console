import type { Page } from '@playwright/test';

import BasePage from '../base-page';

export class PerspectivePage extends BasePage {
  private readonly perspectiveSwitcherToggle = this.page.locator(
    '[data-test-id="perspective-switcher-toggle"]',
  );
  private readonly perspectiveSwitcherMenu = this.page.locator(
    '[data-test-id="perspective-switcher-menu"]',
  );
  private readonly sidebar = this.page.locator('#page-sidebar');
  private readonly projectDropdown = this.page.locator('[data-test-id="namespace-bar-dropdown"]');
  private readonly projectFilterInput = this.page.locator(
    '[data-test="namespace-dropdown-filter"]',
  );
  private readonly createProjectButton = this.page.locator(
    '[data-test="namespace-dropdown-create-project"]',
  );

  constructor(page: Page) {
    super(page);
  }

  private async switchToPerspective(perspectiveName: string): Promise<void> {
    await this.perspectiveSwitcherToggle.waitFor({ state: 'visible', timeout: 60_000 });
    const currentText = await this.perspectiveSwitcherToggle.textContent();
    if (currentText?.includes(perspectiveName)) {
      return;
    }
    await this.robustClick(this.perspectiveSwitcherToggle);
    const option = this.perspectiveSwitcherMenu
      .locator('[data-test-id="perspective-switcher-menu-option"]')
      .filter({ hasText: perspectiveName });
    await this.robustClick(option);
    await this.waitForLoadingComplete();
  }

  async switchToDeveloper(): Promise<void> {
    await this.switchToPerspective('Developer');
  }

  async switchToAdministrator(): Promise<void> {
    await this.switchToPerspective('Administrator');
    // Also handle "Core platform" label (OpenShift 5.0+)
    const currentText = await this.perspectiveSwitcherToggle.textContent();
    if (
      !currentText?.includes('Administrator') &&
      !currentText?.includes('Core platform')
    ) {
      await this.switchToPerspective('Core platform');
    }
  }

  async selectOrCreateProject(name: string): Promise<void> {
    await this.robustClick(this.projectDropdown);
    await this.projectFilterInput.fill(name);

    const projectLink = this.page.locator(`[id="${name}-link"]`);
    if ((await projectLink.count()) > 0) {
      await this.robustClick(projectLink);
    } else {
      await this.robustClick(this.createProjectButton);
      await this.page.locator('#input-name').fill(name);
      await this.robustClick(this.page.locator('[data-test="confirm-action"]'));
    }
    await this.waitForLoadingComplete();
  }

  async navigateToDevMenu(menuItem: string): Promise<void> {
    const menuLink = this.sidebar.locator(`[data-test-id="${menuItem}-header"]`);
    await this.robustClick(menuLink);
    await this.waitForLoadingComplete();
  }

  async navigateToAdd(): Promise<void> {
    await this.navigateToDevMenu('+Add');
  }

  async navigateToTopology(): Promise<void> {
    await this.navigateToDevMenu('topology');
  }

  async navigateToSearch(): Promise<void> {
    await this.navigateToDevMenu('search');
  }

  async navigateToProject(): Promise<void> {
    await this.navigateToDevMenu('project-details');
  }

  async navigateToRoutes(): Promise<void> {
    const routesLink = this.sidebar.locator('a[href*="Route"]');
    await this.robustClick(routesLink);
    await this.waitForLoadingComplete();
  }

  async navigateToConfigMaps(): Promise<void> {
    const configMapsLink = this.sidebar.locator('a[href*="ConfigMap"]');
    await this.robustClick(configMapsLink);
    await this.waitForLoadingComplete();
  }
}
