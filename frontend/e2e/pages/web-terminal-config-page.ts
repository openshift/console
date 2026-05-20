import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class WebTerminalConfigPage extends BasePage {
  private readonly configSection = this.page.getByTestId('web-terminal form-section');
  private readonly incrementButton = this.page.getByTestId('Increment');
  private readonly selectToggle = this.page.getByTestId('console-select-menu-toggle');
  private readonly imageInput = this.page.getByTestId('web-terminal-image');
  private readonly timeoutCheckbox = this.page.getByTestId('timeout-value-checkbox');
  private readonly imageCheckbox = this.page.getByTestId('image-value-checkbox');
  private readonly saveButton = this.page.getByTestId('save-button');
  private readonly successAlert = this.page.getByTestId('success-alert');

  async navigateToWebTerminalConfig(): Promise<void> {
    await this.goTo('/k8s/cluster/operator.openshift.io~v1~Console/cluster');
    await this.waitForLoadingComplete(10_000);
    const customizeButton = this.page.getByRole('button', { name: 'Customize' });
    await customizeButton
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => {});
    if (await customizeButton.first().isVisible()) {
      await this.robustClick(customizeButton.first());
    } else {
      const actionsMenu = this.page.getByTestId('actions-menu-button');
      await this.robustClick(actionsMenu);
      const customizeAction = this.page.locator('[data-test-action="Customize"]:not([disabled])');
      await this.robustClick(customizeAction);
    }
    await this.waitForLoadingComplete(10_000);
    await this.clickWebTerminalTab();
  }

  async clickWebTerminalTab(): Promise<void> {
    const tab = this.page.getByRole('tab', { name: 'Web Terminal' });
    await this.robustClick(tab);
    await this.waitForLoadingComplete(5_000);
  }

  async incrementTimeout(): Promise<void> {
    await this.robustClick(this.incrementButton);
  }

  async selectTimeoutUnit(unit: string): Promise<void> {
    await this.robustClick(this.selectToggle);
    const option = this.page.getByTestId('console-select-item').filter({ hasText: unit });
    await this.robustClick(option);
  }

  async setImageValue(image: string): Promise<void> {
    await this.imageInput.fill(image);
  }

  async checkPersistCheckboxes(): Promise<void> {
    await this.timeoutCheckbox.check();
    await this.imageCheckbox.check();
  }

  async uncheckPersistCheckboxes(): Promise<void> {
    await this.timeoutCheckbox.uncheck();
    await this.imageCheckbox.uncheck();
  }

  async clickSaveButton(): Promise<void> {
    await this.robustClick(this.saveButton);
  }

  getConfigSection(): Locator {
    return this.configSection;
  }

  getSuccessAlert(): Locator {
    return this.successAlert;
  }

  getImageInput(): Locator {
    return this.imageInput;
  }

  getSelectToggle(): Locator {
    return this.selectToggle;
  }

  getTimeoutCheckbox(): Locator {
    return this.timeoutCheckbox;
  }

  getImageCheckbox(): Locator {
    return this.imageCheckbox;
  }
}
