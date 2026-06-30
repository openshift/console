import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class YamlEditorPage extends BasePage {
  private readonly codeEditor = this.page.getByTestId('code-editor');
  private readonly saveButton = this.page.getByTestId('save-changes');
  private readonly reloadButton = this.page.getByTestId('reload-object');
  private readonly yamlError = this.page.getByTestId('yaml-error');
  private readonly resourceSidebar = this.page.getByTestId('resource-sidebar');

  async waitForEditorReady(): Promise<void> {
    await expect(this.codeEditor).toBeVisible({ timeout: 30_000 });
  }

  async waitForSidebarLoaded(): Promise<void> {
    if ((await this.resourceSidebar.count()) > 0) {
      await expect(this.resourceSidebar).toBeAttached({ timeout: 30_000 });
    }
  }

  getSaveButton(): Locator {
    return this.saveButton;
  }

  getYamlError(): Locator {
    return this.yamlError;
  }

  async clickSave(): Promise<void> {
    await this.robustClick(this.saveButton);
  }

  async clickReload(): Promise<void> {
    await this.robustClick(this.reloadButton);
  }
}
