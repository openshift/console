import { expect } from '@playwright/test';

import BasePage from './base-page';

export class MastheadPage extends BasePage {
  readonly loadingIndicator = this.page.getByTestId('loading-indicator');
  readonly globalNotifications = this.page.getByTestId('global-notifications');

  async usernameShouldHaveText(text: string): Promise<void> {
    const toggle = this.page.getByTestId('user-dropdown-toggle');
    await expect(toggle).toHaveText(text);
  }
}
