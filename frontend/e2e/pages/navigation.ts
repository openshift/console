import type { Page } from '@playwright/test';

import { expect } from '../fixtures';

export class Navigation {
  constructor(private page: Page) {}

  async navigateViaNav(section: string, link: string): Promise<void> {
    await this.page.goto('/');
    const sidebar = this.page.locator('#page-sidebar');
    const sectionButton = sidebar.getByRole('button', { name: section });
    const navLink = sidebar.getByRole('link', { name: link });

    // The sidebar re-renders while dynamic plugins load, detaching nav links.
    await expect(async () => {
      const expanded = await sectionButton.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await sectionButton.click({ timeout: 10_000 });
      }
      await navLink.click({ timeout: 10_000 });
    }).toPass({ intervals: [1_000, 2_000, 5_000], timeout: 60_000 });

    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickNavLink(section: string, link: string): Promise<void> {
    const sidebar = this.page.locator('#page-sidebar');
    const sectionButton = sidebar.getByRole('button', { name: section });
    const navLink = sidebar.getByRole('link', { name: link });

    await expect(async () => {
      // eslint-disable-next-line eslint-js/no-restricted-syntax
      await sectionButton.waitFor({ state: 'visible', timeout: 10_000 });
      const expanded = await sectionButton.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await sectionButton.click({ timeout: 10_000 });
      }
      await navLink.click({ timeout: 10_000 });
    }).toPass({ intervals: [1_000, 2_000, 5_000], timeout: 60_000 });

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
