import { Page } from '@playwright/test';

export class Navigation {
  constructor(private page: Page) {}

  async navigateViaNav(section: string, link: string): Promise<void> {
    await this.page.goto('/');
    const sidebar = this.page.locator('#page-sidebar');
    const sectionButton = sidebar.getByRole('button', { name: section });
    await sectionButton.click();
    await sidebar.getByRole('link', { name: link }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickNavLink(section: string, link: string): Promise<void> {
    const sidebar = this.page.locator('#page-sidebar');
    const sectionButton = sidebar.getByRole('button', { name: section });
    // eslint-disable-next-line no-restricted-syntax
    await sectionButton.waitFor({ state: 'visible' });
    const expanded = await sectionButton.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await sectionButton.click();
    }
    await sidebar.getByRole('link', { name: link }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async navigateToAdministration(link: string): Promise<void> {
    await this.navigateViaNav('Administration', link);
  }

  async navigateToWorkloads(link: string): Promise<void> {
    await this.navigateViaNav('Workloads', link);
  }

  async navigateToCompute(link: string): Promise<void> {
    await this.navigateViaNav('Compute', link);
  }

  async navigateToStorage(link: string): Promise<void> {
    await this.navigateViaNav('Storage', link);
  }

  async navigateToUserManagement(link: string): Promise<void> {
    await this.navigateViaNav('User Management', link);
  }
}
