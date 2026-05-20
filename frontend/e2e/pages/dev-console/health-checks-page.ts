import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class HealthChecksPage extends BasePage {
  private readonly healthChecksForm = this.page.locator('div.odc-heath-check-probe-form');
  private readonly successText = this.page.locator('span.odc-heath-check-probe__successText');
  private readonly checkIcon = this.page.locator('[data-test-id="check-icon"]');
  private readonly addButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly saveButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly typeToggle = this.page.getByTestId('console-select-menu-toggle');

  constructor(page: Page) {
    super(page);
  }

  async clickAddProbe(probeName: string): Promise<void> {
    const probeButton = this.page.getByRole('button', { name: probeName });
    await probeButton.scrollIntoViewIfNeeded();
    await this.robustClick(probeButton);
    await expect(this.healthChecksForm).toBeVisible();
  }

  async selectProbeType(type: string): Promise<void> {
    await this.robustClick(this.typeToggle);
    const option = this.page.getByTestId('console-select-item').filter({ hasText: type });
    await this.robustClick(option);

    if (type === 'Container command') {
      const argInput = this.page.locator('[placeholder="argument"]');
      if ((await argInput.count()) > 0) {
        await argInput.fill('example');
      }
    }
  }

  async clickCheckIcon(): Promise<void> {
    await this.robustClick(this.checkIcon);
  }

  async clickAddButton(): Promise<void> {
    await this.robustClick(this.addButton);
  }

  async clickSaveButton(): Promise<void> {
    await this.robustClick(this.saveButton);
  }

  async removeProbe(probeName: string): Promise<void> {
    const probeSuccess = this.page.getByRole('button', { name: probeName });
    const removeIcon = probeSuccess.locator('..').locator('..').locator('[role="img"]');
    await this.robustClick(removeIcon);
  }

  async expectProbesAdded(count: number): Promise<void> {
    await expect(this.successText).toHaveCount(count);
  }

  async expectProbeAdded(probeName: string): Promise<void> {
    await expect(this.successText.filter({ hasText: probeName })).toBeVisible();
  }

  async expectEditHealthChecksTitle(): Promise<void> {
    await expect(this.page.locator('[data-test="page-heading"] h1')).toContainText(
      'Edit health checks',
    );
  }
}
