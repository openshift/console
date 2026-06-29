import { expect } from '@playwright/test';

import BasePage from './base-page';

export class YamlEditorPage extends BasePage {
  async isImportLoaded(): Promise<void> {
    await expect(this.page.locator('.monaco-editor textarea').first()).toBeVisible({
      timeout: 30_000,
    });
  }

  async setEditorContent(text: string): Promise<void> {
    await super.setEditorContent(text);
  }

  async clickSaveCreateButton(): Promise<void> {
    await this.page.getByTestId('save-changes').click();
  }
}
