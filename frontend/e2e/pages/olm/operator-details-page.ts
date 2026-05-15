import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';
import { DetailsPage } from '../details-page';
import { ModalPage } from '../modal-page';

export interface TestOperandProps {
  name: string;
  group: string;
  version: string;
  kind: string;
  createActionID?: string;
  exampleName: string;
}

export class OperatorDetailsPage extends BasePage {
  private readonly detailsPage: DetailsPage;
  private readonly modalPage: ModalPage;

  constructor(page: Page) {
    super(page);
    this.detailsPage = new DetailsPage(page);
    this.modalPage = new ModalPage(page);
  }

  async isLoaded(): Promise<void> {
    await this.page
      .locator('[data-test-id="horizontal-link-Details"]')
      .waitFor({ state: 'attached', timeout: 30_000 });
  }

  async selectTab(tabName: string): Promise<void> {
    const tab = this.page.locator(`[data-test-id="horizontal-link-${tabName}"]`).last();
    await expect(tab).toBeAttached({ timeout: 60_000 });
    await this.robustClick(tab);
    await this.waitForLoadingComplete();
  }

  async openUninstallModal(): Promise<void> {
    await this.detailsPage.clickPageActionFromDropdown('Uninstall Operator');
    await this.modalPage.shouldBeOpened();
    await this.modalPage.modalTitleShouldContain('Uninstall Operator?');
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({
      timeout: 120_000,
    });
  }

  async checkDeleteAllOperands(): Promise<void> {
    await this.robustClick(this.page.getByTestId('delete-all-operands'));
  }

  async createOperand(operand: TestOperandProps): Promise<void> {
    await this.selectTab(operand.name === 'All instances' ? 'All instances' : operand.name);
    await expect(
      this.page.locator(`[data-test-operand-link="${operand.exampleName}"]`),
    ).not.toBeAttached();
    await this.robustClick(this.page.getByTestId('item-create'));
    if (operand.createActionID) {
      await this.robustClick(this.page.getByTestId(operand.createActionID));
    }
    await expect(this.page).toHaveURL(/~new/);
    const nameInput = this.page.locator('#root_metadata_name');
    await expect(nameInput).not.toBeDisabled();
    await nameInput.clear();
    await nameInput.fill(operand.exampleName);
    await this.robustClick(this.page.locator('button[type=submit]'));
    await expect(this.page).not.toHaveURL(/~new/, { timeout: 60_000 });
  }

  async deleteOperand(operand: TestOperandProps): Promise<void> {
    await this.selectTab(operand.name === 'All instances' ? 'All instances' : operand.name);
    await this.robustClick(this.page.locator(`[data-test-operand-link="${operand.exampleName}"]`));
    await this.detailsPage.clickPageActionFromDropdown(`Delete ${operand.kind}`);
    await this.modalPage.shouldBeOpened();
    await this.modalPage.submit();
    await this.modalPage.shouldBeClosed();
  }

  async operandShouldExist(operand: TestOperandProps): Promise<void> {
    await this.selectTab(operand.name === 'All instances' ? 'All instances' : operand.name);
    await expect(this.page.getByTestId(operand.exampleName)).toBeAttached();
  }

  async operandShouldNotExist(operand: TestOperandProps): Promise<void> {
    await this.selectTab(operand.name === 'All instances' ? 'All instances' : operand.name);
    await expect(this.page.getByTestId(operand.exampleName)).not.toBeAttached();
  }

  async uninstall(deleteAllOperands = false): Promise<void> {
    await this.openUninstallModal();
    if (deleteAllOperands) {
      await this.checkDeleteAllOperands();
    }
    await this.modalPage.submit(true);
    await this.modalPage.shouldBeClosed();
  }

  operandLink(name: string): Locator {
    return this.page.locator(`[data-test-operand-link="${name}"]`);
  }

  sectionHeading(name: string): Locator {
    return this.page.locator(`[data-test-section-heading="${name}"]`);
  }
}
