import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';
import { DetailsPage } from './details-page';
import { ModalPage } from './modal-page';

export interface TestOperandProps {
  name: string;
  group: string;
  version: string;
  kind: string;
  exampleName: string;
  createActionID?: string; // Optional - for operators with multiple operand types
}

export class OperatorDetailsPage extends BasePage {
  private readonly detailsPage = new DetailsPage(this.page);
  private readonly modalPage = new ModalPage(this.page);
  private readonly createItemButton = this.page.getByTestId('item-create');
  private readonly nameInput = this.page.locator('[id="root_metadata_name"]');

  /**
   * Verify operator details page sections exist
   */
  async verifyDetailsPageSections(): Promise<void> {
    await expect(this.getSectionHeading('Provided APIs')).toBeVisible({ timeout: 30_000 });
    await expect(this.getSectionHeading('ClusterServiceVersion details')).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByTestId('resource-summary')).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Navigate to operand instances tab
   */
  async navigateToOperandTab(operandName: string, isGlobal: boolean = true): Promise<void> {
    // Ensure we're on the operator details page by checking for operator-specific tabs
    await expect(this.page.getByTestId('horizontal-link-Details')).toBeVisible({ timeout: 5_000 });

    if (isGlobal) {
      // Wait for the "All instances" tab to be available before trying to click it
      await expect(this.page.getByTestId('horizontal-link-All instances')).toBeVisible({ timeout: 5_000 });
      await this.detailsPage.selectTab('All instances');
    } else {
      // For single namespace, try common tab variations
      try {
        await this.detailsPage.selectTab(operandName);
      } catch (error) {
        // If operand name tab doesn't exist, try "All instances" as fallback
        console.log(`Tab ${operandName} not found, trying "All instances"`);
        await expect(this.page.getByTestId('horizontal-link-All instances')).toBeVisible({ timeout: 5_000 });
        await this.detailsPage.selectTab('All instances');
      }
    }
  }

  /**
   * Create operand instance
   */
  async createOperand(testOperand: TestOperandProps, isGlobal: boolean = true): Promise<void> {
    const { exampleName, createActionID } = testOperand;

    await this.navigateToOperandTab(testOperand.name, isGlobal);

    // Wait for the page to load and create button to be visible
    await expect(this.createItemButton).toBeVisible({ timeout: 30_000 });

    // Verify operand doesn't already exist
    await expect(this.getOperandLink(exampleName)).not.toBeAttached();

    // Click create button
    await this.robustClick(this.createItemButton);

    // If createActionID is provided, select it from the dropdown
    if (createActionID) {
      console.log(`Selecting create action: ${createActionID}`);
      const dropdownOption = this.page.getByTestId(createActionID);
      await expect(dropdownOption).toBeVisible({ timeout: 10_000 });
      await this.robustClick(dropdownOption);
    }

    // Verify we're on the create form
    await expect(this.page).toHaveURL(/~new/, { timeout: 30_000 });

    // Fill in the name
    await expect(this.nameInput).toBeEnabled();
    await this.nameInput.clear();
    await this.nameInput.fill(exampleName);

    // Submit the form
    await this.clickSubmitButton();

    // Wait for form submission and redirect
    await expect(this.page).not.toHaveURL(/~new/, { timeout: 30_000 });
  }

  /**
   * Verify operand exists
   */
  async verifyOperandExists(testOperand: TestOperandProps, isGlobal: boolean = true): Promise<void> {
    const { exampleName } = testOperand;

    await this.navigateToOperandTab(testOperand.name, isGlobal);
    await expect(this.page.getByTestId(exampleName)).toBeVisible();

    // Navigate to operand details
    await this.page.getByTestId(exampleName).click();
    await expect(this.page).toHaveURL(url => url.pathname.endsWith(`/${exampleName}`));
  }

  /**
   * Delete operand
   */
  async deleteOperand(testOperand: TestOperandProps, isGlobal: boolean = true): Promise<void> {

    // Double check that we are on the example operand page
    await expect(this.page).toHaveURL(url => url.pathname.endsWith(`/${testOperand.exampleName}`));
    // const { kind, exampleName } = testOperand;

    // First, ensure we're back on the operator details page (not operand details page)
    // Navigate back using breadcrumb or go back to operator details page
    // const breadcrumbLink = this.detailsPage.getBreadcrumb(1); // Assuming operator details is breadcrumb 1
    // if (await breadcrumbLink.count() > 0) {
    //   await this.robustClick(breadcrumbLink);
    // }

    // await this.navigateToOperandTab(testOperand.name, isGlobal);

    // // Navigate to operand details page
    // await this.robustClick(this.getOperandLink(exampleName));

    // Delete the operand
    await this.detailsPage.clickPageAction(`Delete ${testOperand.kind}`);
    await this.modalPage.waitForOpen();
    await this.modalPage.submit();
    await this.modalPage.waitForClosed();
  }

  /**
   * Verify operand no longer exists
   */
  async verifyOperandNotExists(testOperand: TestOperandProps, isGlobal: boolean = true): Promise<void> {
    const { exampleName } = testOperand;

    await this.navigateToOperandTab(testOperand.name, isGlobal);
    await expect(this.page.getByTestId(exampleName)).not.toBeAttached();
  }

  /**
   * Click operand link (no navigation, just click)
   */
  async clickOperandLink(exampleName: string): Promise<void> {
    await this.robustClick(this.getOperandLink(exampleName));
  }

  /**
   * Delete current operand (assumes we're on operand details page)
   */
  async deleteCurrentOperand(kind: string): Promise<void> {
    await this.detailsPage.clickPageAction(`Delete ${kind}`);
    await this.modalPage.waitForOpen();
    await this.modalPage.submit();
    await this.modalPage.waitForClosed();
  }

  /**
   * Verify operand no longer exists on current tab (no navigation)
   */
  async verifyOperandNotExistsOnCurrentTab(exampleName: string): Promise<void> {
    await expect(this.page.getByTestId(exampleName)).not.toBeAttached();
  }

  /**
   * Uninstall operator
   * @param submit - Whether to submit the uninstall or just open the modal (default: true)
   */
  async uninstallOperator(submit: boolean = true): Promise<void> {
    await this.detailsPage.clickPageAction('Uninstall Operator');
    await this.modalPage.waitForOpen();
    await expect(this.modalPage.getModalTitle()).toContainText('Uninstall Operator?');

    // Wait for loading skeleton to disappear
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    if (submit) {
      await this.modalPage.submit();
      await this.modalPage.waitForClosed();
    }
  }

  /**
   * Uninstall operator with all operands
   */
  async uninstallOperatorWithOperands(deleteOperands: boolean = false): Promise<void> {
    await this.detailsPage.clickPageAction('Uninstall Operator');
    await this.modalPage.waitForOpen();
    await expect(this.modalPage.getModalTitle()).toContainText('Uninstall Operator?');

    // Wait for loading skeleton to disappear
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    // Check delete all operands option if it exists and is requested
    if (deleteOperands) {
      console.log('🔍 Looking for delete-all-operands checkbox...');
      const deleteAllOperandsCheckbox = this.page.getByTestId('delete-all-operands');
      try {
        await expect(deleteAllOperandsCheckbox).toBeVisible({ timeout: 5_000 });
        console.log('✅ Found delete-all-operands checkbox, clicking it...');
        await deleteAllOperandsCheckbox.click();
        console.log('✅ Successfully clicked delete-all-operands checkbox');
      } catch (error) {
        console.log('⏹️ No delete-all-operands checkbox found - this operator may only have one operand');
        console.log('⏹️ Continuing with uninstall without checkbox...');
      }
    } else {
      console.log('⏹️ Skipping delete-all-operands checkbox (deleteOperands = false)');
    }

    await this.modalPage.submit();
    await this.modalPage.waitForClosed();
  }

  /**
   * Uninstall operator with API error interception
   */
  async uninstallOperatorWithAPIError(errorType: 'cannot-load-operands' | 'error-deleting-operands'): Promise<void> {
    // Set up API interception based on error type
    if (errorType === 'cannot-load-operands') {
      await this.page.route('**/apis/operators.coreos.com/v1alpha1/namespaces/*/clusterserviceversions/*/instances**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            kind: 'Status',
            apiVersion: 'v1',
            metadata: {},
            status: 'Failure',
            message: 'Internal server error',
            reason: 'InternalError',
            code: 500
          })
        });
      });
    } else if (errorType === 'error-deleting-operands') {
      // Intercept DELETE requests for operands
      await this.page.route('**/apis/*/v*/namespaces/*/devworkspaces/**', route => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              kind: 'Status',
              apiVersion: 'v1',
              metadata: {},
              status: 'Failure',
              message: 'Unable to delete operand',
              reason: 'InternalError',
              code: 500
            })
          });
        } else {
          route.continue();
        }
      });
    }

    await this.detailsPage.clickPageAction('Uninstall Operator');
    await this.modalPage.waitForOpen();
    await expect(this.modalPage.getModalTitle()).toContainText('Uninstall Operator?');

    if (errorType === 'cannot-load-operands') {
      // Wait for error alert to appear
      await expect(this.page.getByTestId('alert-danger')).toContainText('Cannot load Operands');
    } else if (errorType === 'error-deleting-operands') {
      // Check delete all operands option first to trigger the delete requests
      await this.page.getByTestId('delete-all-operands').click();

      // Wait for error alert to appear
      await expect(this.page.getByTestId('alert-danger')).toContainText('Error Deleting Operands');
    }
  }

  /**
   * Verify alert message appears in uninstall modal
   */
  async verifyUninstallAlert(expectedText: string): Promise<void> {
    // const alert = this.page.getByTestId(`alert-${alertType}`);
    const modal = this.page.getByRole('dialog');
    // const modalTitle = this.page.getByTestId('modal-title')
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(expectedText);
  }

  /**
   * Cancel uninstall modal
   */
  async cancelUninstall(): Promise<void> {
    await this.modalPage.cancel();
    await this.modalPage.waitForClosed();
  }

  /**
   * Get section heading locator
   */
  getSectionHeading(text: string): Locator {
    return this.page.locator(`[data-test-section-heading="${text}"]`);
  }

  /**
   * Get operand link locator
   */
  getOperandLink(operandName: string): Locator {
    return this.page.getByTestId(operandName);
  }

  /**
   * Click submit button
   */
  private async clickSubmitButton(): Promise<void> {
    const submitButton = this.page.locator('[data-test="confirm-action"], .pf-v6-c-button.pf-m-primary[type="submit"]');
    await this.robustClick(submitButton);
  }

  getCreateItemButton(): Locator {
    return this.createItemButton;
  }

  getNameInput(): Locator {
    return this.nameInput;
  }
}
