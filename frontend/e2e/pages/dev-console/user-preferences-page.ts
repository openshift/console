import type { Locator } from '@playwright/test';
import { coerce, gtr } from 'semver';

import BasePage from '../base-page';
import { MastheadPage } from '../masthead-page';

export class UserPreferencesPage extends BasePage {
  private readonly masthead = new MastheadPage(this.page);

  async navigateToPreferences(): Promise<void> {
    await this.masthead.openUserDropdown();
    const userPrefsLink = this.page.getByRole('menuitem', { name: 'User preferences' });
    await this.robustClick(userPrefsLink);
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

  getThemeToggle(): Locator {
    return this.page.getByTestId('theme-selector-toggle');
  }

  getThemePanel(): Locator {
    return this.page.getByTestId('theme-selector-panel');
  }

  getThemeDialog(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.getThemePanel() });
  }

  getThemeHeadings(): Locator {
    return this.getThemePanel().getByRole('heading');
  }

  getThemeGroup(groupName: 'Contrast mode' | 'Color scheme'): Locator {
    return this.getThemePanel().getByRole('group', { name: groupName });
  }

  getThemeGroupContainer(groupName: 'Contrast mode' | 'Color scheme'): Locator {
    const preferenceKey =
      groupName === 'Contrast mode' ? 'console.theme/contrast' : 'console.theme/color-scheme';
    return this.getThemePanel().getByTestId(`${preferenceKey} field`);
  }

  getThemeOption(groupName: 'Contrast mode' | 'Color scheme', optionName: string): Locator {
    return this.getThemeGroup(groupName).getByRole('button', { name: optionName });
  }

  async openTheme(): Promise<void> {
    const toggle = this.getThemeToggle();
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
      await this.robustClick(toggle);
    }
  }

  async selectThemeOption(
    groupName: 'Contrast mode' | 'Color scheme',
    optionName: string,
  ): Promise<void> {
    await this.openTheme();
    await this.robustClick(this.getThemeOption(groupName, optionName));
  }

  async closeTheme(): Promise<void> {
    if ((await this.getThemeToggle().getAttribute('aria-expanded')) === 'true') {
      await this.page.keyboard.press('Escape');
    }
  }

  async focusByKeyboard(target: Locator, maxTabs = 50): Promise<void> {
    for (let index = 0; index < maxTabs; index++) {
      if (await target.evaluate((element) => element === document.activeElement)) {
        return;
      }
      await this.page.keyboard.press('Tab');
    }
    throw new Error(`Unable to focus target with ${maxTabs} Tab presses`);
  }

  /** Mirrors IS_OPENSHIFT_5 in packages/console-app/src/features/openshift5.ts */
  async isOpenShift5(): Promise<boolean> {
    const releaseVersion = await this.page.evaluate(() => window.SERVER_FLAGS?.releaseVersion);
    return gtr(coerce(releaseVersion || '5.0.0-unknown'), '4.x', {
      includePrerelease: true,
      loose: true,
    });
  }

  async reloadPreferences(): Promise<void> {
    await this.page.reload();
    await this.waitForLoadingComplete();
  }

  async navigateToUrl(url: string): Promise<void> {
    await this.goTo(url);
  }

  getDocumentRoot(): Locator {
    return this.page.locator('html');
  }

  getTopologyCanvas(): Locator {
    // Legacy data-test-id selector: PatternFly VisualizationSurface renders data-test-id, no data-test available
    return this.page.locator('[data-test-id="topology"]');
  }
}
