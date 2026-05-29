import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class YamlEditorPage extends BasePage {
  private readonly monacoEditor: Locator = this.page.locator('.monaco-editor');
  private readonly settingsButton: Locator = this.page.locator('[aria-label="Editor settings"]');
  private readonly settingsModal: Locator = this.page.locator(
    '[data-ouia-component-id="edit-yaml-settings-modal"]',
  );
  private readonly showSidebarButton: Locator = this.page.locator('[aria-label="Show sidebar"]');

  private readonly themeSection: Locator = this.page.locator('#ConfigModalItem-color-theme');
  private readonly fontSizeSection: Locator = this.page.locator('#ConfigModalItem-font-size');
  private readonly fontSizeInput: Locator = this.fontSizeSection.locator(
    'input[aria-label="Enter a font size"]',
  );
  private readonly fontSizeIncrease: Locator = this.fontSizeSection.locator(
    'button[aria-label="Increase font size"]',
  );
  private readonly fontSizeDecrease: Locator = this.fontSizeSection.locator(
    'button[aria-label="Decrease font size"]',
  );

  async navigateToImport(namespace = 'default'): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/import`);
    await this.monacoEditor.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async waitForMonacoReady(): Promise<void> {
    await this.monacoEditor.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async getEditorContent(): Promise<string> {
    return this.page.evaluate(() => {
      const models = (window as any).monaco?.editor?.getModels?.();
      return models?.[0]?.getValue() ?? '';
    });
  }

  async setEditorContent(text: string): Promise<void> {
    await this.page.evaluate((content) => {
      const models = (window as any).monaco?.editor?.getModels?.();
      models?.[0]?.setValue(content);
    }, text);
  }

  async openSettings(): Promise<void> {
    await this.robustClick(this.settingsButton);
    await this.settingsModal.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async closeSettings(): Promise<void> {
    await this.settingsModal.locator('button[aria-label="Close"]').click();
    await this.settingsModal.waitFor({ state: 'detached', timeout: 5_000 });
  }

  get settingsModalLocator(): Locator {
    return this.settingsModal;
  }

  async selectTheme(themeName: 'Dark' | 'Light' | 'Use theme setting'): Promise<void> {
    const toggle = this.themeSection.locator(
      'button[aria-labelledby="ConfigModalItem-color-theme-title"]',
    );
    await this.robustClick(toggle);
    await this.page.getByText(themeName, { exact: true }).click();
  }

  get fontSizeInputLocator(): Locator {
    return this.fontSizeInput;
  }

  get fontSizeIncreaseLocator(): Locator {
    return this.fontSizeIncrease;
  }

  get fontSizeDecreaseLocator(): Locator {
    return this.fontSizeDecrease;
  }

  async setFontSize(size: number): Promise<void> {
    await this.fontSizeInput.fill(String(size));
  }

  async openSidebar(): Promise<void> {
    await this.robustClick(this.showSidebarButton);
  }

  async clickFieldDetails(fieldName: string): Promise<void> {
    const fieldItem = this.page.locator('h5', { hasText: fieldName }).locator('xpath=ancestor::li');
    await this.robustClick(fieldItem.locator('button.pf-v6-c-button', { hasText: 'View details' }));
  }
}
