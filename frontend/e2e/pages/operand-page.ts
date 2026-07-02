import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class OperandPage extends BasePage {
  private readonly createButton = this.page.getByTestId('item-create');
  private readonly createFormSubmit = this.page.getByTestId('create-dynamic-form');
  private readonly operandDetailsSection = this.page.getByTestId(
    'operand-details__section--info',
  ).first();
  private readonly resourceTitle = this.page.getByTestId('resource-title');

  async navigateTo(url: string): Promise<void> {
    await this.goTo(url);
  }

  getOperandLink(name: string): Locator {
    return this.page.getByTestId(name);
  }

  async clickOperandLink(name: string): Promise<void> {
    await this.robustClick(this.getOperandLink(name), { force: true });
  }

  getResourceTitle(): Locator {
    return this.resourceTitle;
  }

  getDetailsItemLabel(label: string): Locator {
    return this.page.getByTestId(`details-item-label__${label}`).first();
  }

  getOperandDetailsSection(): Locator {
    return this.operandDetailsSection;
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton, { force: true });
  }

  getFormHeading(): Locator {
    return this.page.getByTestId('page-heading').locator('h1');
  }

  getFormFieldElement(id: string): Locator {
    return this.page.locator(`#${id}_field`);
  }

  getFormFieldLabel(id: string): Locator {
    return this.page.locator(`[for="${id}"]`);
  }

  getFormFieldInput(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  getFormFieldGroup(id: string): Locator {
    return this.page.locator(`#${id}_field-group`);
  }

  getFormFieldGroupToggle(id: string): Locator {
    return this.page.locator(`#${id}_accordion-toggle`);
  }

  async toggleFieldGroup(id: string): Promise<void> {
    await this.robustClick(this.getFormFieldGroupToggle(id));
  }

  getTagItemContent(fieldId: string): Locator {
    return this.page.locator(`#${fieldId}_field .tag-item-content`);
  }

  async fillNameField(id: string, value: string): Promise<void> {
    await this.getFormFieldInput(id).fill(value);
  }

  async submitCreateForm(): Promise<void> {
    await this.robustClick(this.createFormSubmit);
  }
}
