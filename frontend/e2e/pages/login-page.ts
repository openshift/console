import { expect } from '@playwright/test';

import BasePage from './base-page';

export class LoginPage extends BasePage {
  private readonly loginButton = this.page.getByTestId('login');
  private readonly usernameInput = this.page.locator('#inputUsername');
  private readonly passwordInput = this.page.locator('#inputPassword');
  private readonly submitButton = this.page.locator('button[type="submit"]');
  private readonly userDropdownToggle = this.page.getByTestId('user-dropdown-toggle');

  providerButton(provider: string) {
    return this.page.getByText(provider, { exact: true });
  }

  async loginAs(provider: string, username: string, password: string): Promise<boolean> {
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';
    await this.page.goto(baseURL, { timeout: 90_000, waitUntil: 'domcontentloaded' });

    const authDisabled = await this.page
      .evaluate(() => (window as any).SERVER_FLAGS?.authDisabled)
      .catch(() => false);

    if (authDisabled) {
      return false;
    }

    const providerBtn = this.providerButton(provider);
    await expect(
      this.loginButton.or(this.usernameInput).or(providerBtn).first(),
    ).toBeVisible({ timeout: 30_000 });

    if ((await providerBtn.count()) > 0 && (await providerBtn.isVisible())) {
      await providerBtn.click();
      await expect(this.usernameInput).toBeVisible({ timeout: 30_000 });
    }

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await expect(this.userDropdownToggle).toBeVisible({ timeout: 60_000 });
    return true;
  }
}
