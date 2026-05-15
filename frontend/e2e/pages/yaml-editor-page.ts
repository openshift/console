import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class YamlEditorPage extends BasePage {
  private readonly codeEditor = this.page.getByTestId('code-editor');

  constructor(page: Page) {
    super(page);
  }

  async isLoaded(): Promise<void> {
    await expect(this.codeEditor).toBeAttached();
  }

  async getEditorContent(): Promise<string> {
    await this.isLoaded();
    return this.page.evaluate(() => {
      const models = (window as any).monaco?.editor?.getModels?.();
      return models?.[0]?.getValue() ?? '';
    });
  }

  async setEditorContent(text: string): Promise<void> {
    await this.isLoaded();
    await this.page.evaluate((content) => {
      const models = (window as any).monaco?.editor?.getModels?.();
      models?.[0]?.setValue(content);
    }, text);
  }
}
