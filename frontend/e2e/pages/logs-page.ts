import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class LogsPage extends BasePage {
  readonly lineCount: Locator = this.page.getByTestId('resource-log-no-lines');
  private readonly optionsToggle: Locator = this.page.getByTestId('resource-log-options-toggle');
  private readonly showFullLogOption: Locator = this.page.getByTestId('show-full-log');
  private readonly wrapLinesOption: Locator = this.page.getByTestId('wrap-lines');
  private readonly wrapCheckbox: Locator = this.wrapLinesOption.locator('input[type="checkbox"]');
  private readonly containerSelect: Locator = this.page.getByTestId('container-select');
  private readonly searchInput: Locator = this.page.getByPlaceholder('Search logs');
  readonly searchMatches: Locator = this.page.locator('.pf-m-match');
  readonly logText: Locator = this.page.locator('.pf-v6-c-log-viewer__text');

  async waitForLoaded(): Promise<void> {
    await expect
      .poll(
        async () => {
          if (await this.optionsToggle.isVisible().catch(() => false)) {
            return true;
          }
          const tryAgain = this.page.getByRole('button', { name: 'Try again' });
          if (await tryAgain.isVisible().catch(() => false)) {
            await this.page.reload({ waitUntil: 'domcontentloaded' });
          }
          return false;
        },
        { timeout: 30_000, intervals: [3_000] },
      )
      .toBe(true);
  }

  async toggleOptions(): Promise<void> {
    await this.robustClick(this.optionsToggle);
  }

  async clickShowFullLog(): Promise<void> {
    await this.toggleOptions();
    await this.robustClick(this.showFullLogOption);
  }

  async setWrap(enabled: boolean): Promise<void> {
    await this.toggleOptions();
    if (enabled) {
      await this.wrapCheckbox.check();
    } else {
      await this.wrapCheckbox.uncheck();
    }
    await this.toggleOptions();
  }

  async isWrapChecked(): Promise<boolean> {
    await this.toggleOptions();
    const checked = await this.wrapCheckbox.isChecked();
    await this.toggleOptions();
    return checked;
  }

  async selectContainer(name: string): Promise<void> {
    await this.robustClick(this.containerSelect);
    await this.robustClick(this.page.getByTestId(name));
  }

  async searchLogs(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }
}
