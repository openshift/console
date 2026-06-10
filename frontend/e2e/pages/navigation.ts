import { Page } from '@playwright/test';

/**
 * Helper class for navigating using the primary navigation menu
 */
export class Navigation {
  constructor(private page: Page) {}

  /**
   * Navigate using the primary nav by expanding a nav section and clicking a link
   * @param section - The nav section to expand (e.g., "Administration", "Workloads")
   * @param link - The link to click within that section (e.g., "CustomResourceDefinitions", "Pods")
   */
  async navigateViaNav(section: string, link: string): Promise<void> {
    // Navigate to home first to ensure app is loaded
    await this.page.goto('/');
    const sectionButton = this.page.getByRole('button', { name: section });
    await sectionButton.click();
    await this.page.getByRole('link', { name: link }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to CustomResourceDefinitions via Administration nav
   */
  async navigateToCRDs(): Promise<void> {
    await this.navigateViaNav('Administration', 'CustomResourceDefinitions');
  }

  /**
   * Navigate to a specific page via Administration nav
   */
  async navigateToAdministration(link: string): Promise<void> {
    await this.navigateViaNav('Administration', link);
  }

  /**
   * Navigate to a specific page via Workloads nav
   */
  async navigateToWorkloads(link: string): Promise<void> {
    await this.navigateViaNav('Workloads', link);
  }

  /**
   * Navigate to a specific page via Compute nav
   */
  async navigateToCompute(link: string): Promise<void> {
    await this.navigateViaNav('Compute', link);
  }

  /**
   * Navigate to a specific page via Storage nav
   */
  async navigateToStorage(link: string): Promise<void> {
    await this.navigateViaNav('Storage', link);
  }

  /**
   * Navigate to a specific page via User Management nav
   */
  async navigateToUserManagement(link: string): Promise<void> {
    await this.navigateViaNav('User Management', link);
  }
}
