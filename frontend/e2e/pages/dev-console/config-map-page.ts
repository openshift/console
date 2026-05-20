import type { Page } from '@playwright/test';

import BasePage from '../base-page';

export class ConfigMapPage extends BasePage {
  private readonly createButton = this.page.locator('[data-test="item-create"]');
  private readonly nameInput = this.page.getByTestId('configmap-name');
  private readonly initialKeyInput = this.page.getByTestId('key-0');
  private readonly secondKeyInput = this.page.getByTestId('key-1');
  private readonly valueTextarea = this.page.locator('[data-test-id="file-input-textarea"]');
  private readonly addKeyValueButton = this.page.getByTestId('add-key-value-button');
  private readonly submitButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly dataSectionBody = this.page.locator('.co-m-pane__body');

  constructor(page: Page) {
    super(page);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillKey(key: string): Promise<void> {
    await this.initialKeyInput.scrollIntoViewIfNeeded();
    await this.initialKeyInput.fill(key);
  }

  async fillValue(value: string): Promise<void> {
    await this.valueTextarea.scrollIntoViewIfNeeded();
    await this.valueTextarea.fill(value);
  }

  async submitForm(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async addKeyValue(): Promise<void> {
    await this.robustClick(this.addKeyValueButton.first());
  }

  async fillSecondKey(key: string): Promise<void> {
    await this.secondKeyInput.scrollIntoViewIfNeeded();
    await this.secondKeyInput.fill(key);
  }

  async createConfigMap(name: string, key = 'test-key', value = 'test-value'): Promise<void> {
    await this.clickCreate();
    await this.fillName(name);
    await this.fillKey(key);
    await this.fillValue(value);
    await this.submitForm();
  }

  async expectDataSectionToContain(text: string): Promise<void> {
    const { expect } = await import('@playwright/test');
    await expect(this.dataSectionBody).toContainText(text);
  }
}
