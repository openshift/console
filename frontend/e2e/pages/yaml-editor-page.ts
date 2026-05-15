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
      const models = (window as any).monaco.editor.getModels();
      models[0].setValue(content);
    }, text);
  }

  async clickSaveCreateButton(): Promise<void> {
    await this.page.getByTestId('save-changes').click();
  }
}
