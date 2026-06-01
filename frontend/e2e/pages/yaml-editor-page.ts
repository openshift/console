import BasePage from './base-page';

export class YamlEditorPage extends BasePage {
  async isImportLoaded(): Promise<void> {
    await this.page.locator('.monaco-editor textarea').first().waitFor({
      state: 'visible',
      timeout: 30_000,
    });
  }

  async setEditorContent(text: string): Promise<void> {
    await this.page.evaluate((content) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const models = (window as any).monaco?.editor?.getModels?.() ?? [];
      if (!models[0]) {
        throw new Error('Monaco editor model not available');
      }
      models[0].setValue(content);
    }, text);
  }

  async clickSaveCreateButton(): Promise<void> {
    await this.page.getByTestId('save-changes').click();
  }
}
