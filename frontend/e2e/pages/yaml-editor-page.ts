import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

const SETTINGS_MODAL_ID = 'edit-yaml-settings-modal';

export class YamlEditorPage extends BasePage {
  private readonly codeEditor = this.page.getByTestId('code-editor');
  private readonly saveButton = this.page.getByTestId('save-changes');
  private readonly reloadButton = this.page.getByTestId('reload-object');
  private readonly yamlError = this.page.getByTestId('yaml-error');
  private readonly resourceSidebar = this.page.getByTestId('resource-sidebar');

  async navigateToImportYaml(): Promise<void> {
    await this.goTo('/k8s/ns/default/import');
  }

  async waitForEditorReady(): Promise<void> {
    const mounting = this.page.getByTestId('code-editor-mounting');
    await expect(mounting.or(this.codeEditor)).toBeVisible({ timeout: 60_000 });
    await expect(this.codeEditor).toBeVisible({ timeout: 60_000 });
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

  getMonacoEditor(): Locator {
    return this.page.locator('.monaco-editor').first();
  }

  getMonacoViewLines(): Locator {
    return this.page.locator('.monaco-editor .view-lines').first();
  }

  getSettingsModal(): Locator {
    return this.page.locator(`[data-ouia-component-id="${SETTINGS_MODAL_ID}"]`);
  }

  getSettingsModalTitle(): Locator {
    return this.page.locator(`#${SETTINGS_MODAL_ID}-title`);
  }

  getSettingsModalBody(): Locator {
    return this.page.locator(`#${SETTINGS_MODAL_ID}-body`);
  }

  getFontSizeInput(): Locator {
    return this.page
      .locator('#ConfigModalItem-font-size')
      .locator('input[aria-label="Enter a font size"]');
  }

  getFontSizeIncreaseButton(): Locator {
    return this.page
      .locator('#ConfigModalItem-font-size')
      .locator('button[aria-label="Increase font size"]');
  }

  getFontSizeDecreaseButton(): Locator {
    return this.page
      .locator('#ConfigModalItem-font-size')
      .locator('button[aria-label="Decrease font size"]');
  }

  async clickSave(): Promise<void> {
    await this.robustClick(this.saveButton);
  }

  async clickReload(): Promise<void> {
    await this.robustClick(this.reloadButton);
  }

  async openSettingsModal(): Promise<void> {
    await this.robustClick(this.page.locator('[aria-label="Editor settings"]'));
    // eslint-disable-next-line no-restricted-syntax
    await this.getSettingsModal().waitFor({ state: 'visible' });
  }

  async closeSettingsModal(): Promise<void> {
    await this.robustClick(
      this.getSettingsModal().locator('button[aria-label="Close"]'),
    );
  }

  async selectTheme(themeName: 'Dark' | 'Light' | 'Use theme setting'): Promise<void> {
    const themeSection = this.page.locator('#ConfigModalItem-color-theme');
    await this.robustClick(
      themeSection.locator('button[aria-labelledby="ConfigModalItem-color-theme-title"]'),
    );
    await this.page.getByText(themeName, { exact: true }).click();
  }

  async setFontSize(size: number): Promise<void> {
    const input = this.getFontSizeInput();
    await input.fill(String(size));
  }

  async showSidebar(): Promise<void> {
    await this.robustClick(this.page.locator('[aria-label="Show sidebar"]'));
  }

  async clickFieldDetailsButton(fieldName: string): Promise<void> {
    const fieldHeading = this.page.locator('h5', { hasText: fieldName });
    const listItem = fieldHeading.locator('xpath=ancestor::li');
    const viewDetailsButton = listItem.locator('button.pf-v6-c-button', {
      hasText: 'View details',
    });
    await this.robustClick(viewDetailsButton);
  }
}
