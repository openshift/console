import type { Page } from '@playwright/test';

import BasePage from './base-page';

export class NavPage extends BasePage {
  private readonly sidebar = this.page.locator('#page-sidebar');

  constructor(page: Page) {
    super(page);
  }

  async clickNavLink(path: string[]): Promise<void> {
    if (path.length === 2) {
      const parentButton = this.sidebar.getByRole('button', { name: path[0], exact: true });
      const isExpanded =
        (await parentButton.getAttribute('aria-expanded').catch(() => null)) === 'true';
      if (!isExpanded) {
        await this.robustClick(parentButton);
      }
      const childLink = this.sidebar
        .getByRole('region', { name: path[0] })
        .getByRole('link', { name: path[1], exact: true });
      await this.robustClick(childLink);
    } else {
      const targetButton = this.sidebar.getByRole('button', { name: path[0], exact: true });
      await this.robustClick(targetButton);
    }
    await this.waitForLoadingComplete();
  }
}
