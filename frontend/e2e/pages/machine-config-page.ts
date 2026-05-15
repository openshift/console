import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class MachineConfigPage extends BasePage {
  readonly configFilePath = this.page.getByTestId('config-file-path-0');
  readonly copyToClipboard = this.page.locator('.co-copy-to-clipboard__text');

  sectionHeading(heading: string): Locator {
    return this.page.locator(`[data-test-section-heading="${heading}"]`);
  }

  errorHeading(text: string): Locator {
    return this.page.getByText(text);
  }

  async checkConfigFileDetails(mode: number, overwrite: boolean, content: string): Promise<void> {
    await this.configFilePath.scrollIntoViewIfNeeded();
    await this.page.locator('button[aria-label="Info"]').first().click();
    const descriptionList = this.page.locator('[class*="description-list"]');
    await expect(descriptionList.getByText(String(mode), { exact: true })).toBeVisible();
    await expect(descriptionList.getByText(String(overwrite), { exact: true })).toBeVisible();
    const decoded = decodeURIComponent(content)
      .replace(/^(data:,)/, '')
      .slice(0, 30);
    const codeBlock = this.page.locator('code').first();
    await expect(codeBlock).toContainText(decoded);
  }
}
