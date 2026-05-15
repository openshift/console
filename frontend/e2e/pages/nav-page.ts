import { expect } from '@playwright/test';

import BasePage from './base-page';

export class NavPage extends BasePage {
  readonly clusterSettingsHeading = this.page.locator(
    '[data-test-id="cluster-settings-page-heading"]',
  );

  private get sidebar() {
    return this.page.locator('#page-sidebar');
  }

  private get perspectiveSwitcherToggle() {
    return this.page.locator('[data-test-id="perspective-switcher-toggle"]');
  }

  async perspectiveSwitcherShouldHaveText(text: string): Promise<void> {
    const toggle = this.perspectiveSwitcherToggle;
    await toggle.scrollIntoViewIfNeeded();

    const isSinglePerspective = (await toggle.getAttribute('id')) === 'core-platform-perspective';
    if (isSinglePerspective) {
      await expect(toggle).toContainText(text, { timeout: 30_000 });
    } else {
      await expect(toggle.locator('.pf-v6-c-menu-toggle__text')).toContainText(text, {
        timeout: 30_000,
      });
    }
  }

  async changePerspectiveTo(perspective: string): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    const toggle = this.perspectiveSwitcherToggle;
    await toggle.scrollIntoViewIfNeeded();
    await toggle.waitFor({ state: 'visible' });

    const isSinglePerspective = (await toggle.getAttribute('id')) === 'core-platform-perspective';
    if (isSinglePerspective) {
      return;
    }

    const currentText = await toggle.locator('.pf-v6-c-menu-toggle__text').textContent();

    if (currentText?.trim() === perspective) {
      return;
    }

    await this.robustClick(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 });
    const option = this.page
      .locator('[data-test-id="perspective-switcher-menu-option"]')
      .filter({ hasText: perspective });
    await this.robustClick(option);
  }

  async shouldHaveNavSection(path: string[]): Promise<void> {
    for (const item of path) {
      await expect(this.sidebar).toContainText(item);
    }
  }

  async shouldNotHaveNavSection(path: string[]): Promise<void> {
    const target = path[path.length - 1];
    await expect(this.sidebar.getByText(target, { exact: true })).toBeHidden();
  }

  async clickNavLink(path: string[]): Promise<void> {
    const navItem = this.sidebar.getByText(path[0]);
    const expanded = await navItem.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await this.robustClick(navItem);
    }
    if (path.length === 2) {
      await this.robustClick(this.sidebar.getByText(path[1]));
    }
  }
}
