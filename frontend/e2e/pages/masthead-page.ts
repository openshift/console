import { type Locator, expect } from '@playwright/test';

import BasePage from './base-page';

export class MastheadPage extends BasePage {
  private readonly logo: Locator = this.page.getByTestId('masthead-logo');
  private readonly quickCreateToggle: Locator = this.page.getByTestId('quick-create-dropdown');
  private readonly userDropdownToggle: Locator = this.page.getByTestId('user-dropdown-toggle');
  private readonly copyLoginCommandLink: Locator = this.page
    .getByTestId('copy-login-command')
    .locator('a');
  private readonly logOutItem: Locator = this.page.getByTestId('log-out');
  readonly pageHeading: Locator = this.page.getByTestId('page-heading').locator('h1');

  get logoLocator(): Locator {
    return this.logo;
  }

  async openQuickCreate(): Promise<void> {
    // Move mouse away first to dismiss any tooltip that could intercept the click
    await this.page.mouse.move(0, 0);
    await this.quickCreateToggle.click();
    await expect(this.page.getByTestId('qc-import-yaml')).toBeVisible({ timeout: 10_000 });
  }

  async clickQuickCreateItem(testId: string): Promise<void> {
    // Navigate via href — PF6 dropdown re-renders detach the anchor mid-click
    const link = this.page.getByTestId(testId).getByRole('menuitem');
    const href = await link.getAttribute('href');
    if (href) {
      await this.page.goto(href);
    } else {
      await link.click();
    }
  }

  async openUserDropdown(): Promise<void> {
    await this.userDropdownToggle.click();
  }

  async isAuthDisabled(): Promise<boolean> {
    return this.page.evaluate(() => {
      const w = window as Window & { SERVER_FLAGS?: { authDisabled?: boolean } };
      return !!w.SERVER_FLAGS?.authDisabled;
    });
  }

  async clickCopyLoginCommand(): Promise<void> {
    await expect(this.copyLoginCommandLink).toBeVisible();
    await this.copyLoginCommandLink.evaluate((el: HTMLAnchorElement) =>
      el.removeAttribute('target'),
    );
    await this.copyLoginCommandLink.click();
  }

  async clickLogOut(): Promise<void> {
    await this.robustClick(this.logOutItem);
  }
}
