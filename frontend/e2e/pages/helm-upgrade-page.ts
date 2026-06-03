import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class HelmUpgradePage extends BasePage {
  private readonly pageTitle: Locator;
  private readonly chartVersionDropdown: Locator;
  private readonly chartVersionOptions: Locator;
  private readonly upgradeButton: Locator;
  private readonly replicaCountInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = this.page.getByRole('heading', { name: /Upgrade Helm Release/i });
    this.chartVersionDropdown = this.page.locator('#form-dropdown-chartVersion-field');
    this.chartVersionOptions = this.page.getByTestId('console-select-item');
    this.upgradeButton = this.page.getByTestId('save-changes');
    this.replicaCountInput = this.page.locator('[data-test="replica-count-field"]');
  }

  async verifyTitle(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async updateReplicaCount(count: string): Promise<void> {
    await this.replicaCountInput.clear();
    await this.replicaCountInput.fill(count);
  }

  async selectDifferentChartVersion(): Promise<void> {
    // Wait for dropdown to be enabled
    await expect(this.chartVersionDropdown).toBeEnabled({ timeout: 10_000 });

    // Click to open dropdown
    await this.robustClick(this.chartVersionDropdown);

    // Get count of available versions
    // const count = await this.chartVersionOptions.count();

    // Select a random version (but not the first one which might be current)
    // const randomIndex = Math.floor(Math.random() * (count - 1)) + 1;
    await this.robustClick(this.chartVersionOptions.nth(0));
  }

  async confirmChartVersionChange(): Promise<void> {
    // Handle the warning modal
    const modalTitle = this.page.locator('[role="dialog"] h1.pf-v6-c-modal-box__title');
    await expect(modalTitle).toContainText('Change chart version?');

    const confirmButton = this.page
      .locator('[role="dialog"] [data-ouia-component-id="HelmChangeChartVersionConfirmation-confirm-button"]');
    await this.robustClick(confirmButton);
  }

  async clickUpgrade(): Promise<void> {
    await this.robustClick(this.upgradeButton);

    // Wait for progress indicator to disappear
    const progressIndicator = this.page.locator('.pf-v6-c-button__progress');
    await expect(progressIndicator).not.toBeAttached({ timeout: 120_000 });
  }
}
