import type { Locator } from '@playwright/test';

import BasePage from '../base-page';
import { MastheadPage } from '../masthead-page';

export class UserPreferencesPage extends BasePage {
  private readonly masthead = new MastheadPage(this.page);

  async navigateToPreferences(): Promise<void> {
    await this.masthead.openUserDropdown();
    const userPrefsLink = this.page.getByRole('menuitem', { name: 'User Preferences' });
    await this.robustClick(userPrefsLink);
    await this.waitForLoadingComplete();
  }

  getTab(tabName: string): Locator {
    return this.page.getByRole('tab', { name: tabName });
  }

  getPreferenceDropdown(id: string): Locator {
    return this.page.getByTestId(`${id} field`).locator('button').first();
  }

  async selectPreferenceOption(id: string, optionName: string): Promise<void> {
    const dropdown = this.getPreferenceDropdown(id);
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: optionName });
    await this.robustClick(option);
  }

  getTopologyCanvas(): Locator {
    // Legacy data-test-id selector: PatternFly VisualizationSurface renders data-test-id, no data-test available
    return this.page.locator('[data-test-id="topology"]');
  }
}
