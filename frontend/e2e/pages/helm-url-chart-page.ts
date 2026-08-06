import type { Locator } from '@playwright/test';

import BasePage from './base-page';

/**
 * Page object for the Helm URL chart install wizard.
 *
 * Step 1 (ChartDetails): user provides chart URL, release name, and chart version.
 * Step 2 (ConfigureInstall): user reviews chart details and clicks Install.
 */
export class HelmUrlChartPage extends BasePage {
  // Step 1 — Chart details form
  private readonly chartUrlInput = this.page.locator('[data-test="oci-chart-url"] input');
  private readonly releaseNameInput = this.page.locator('[data-test="oci-release-name"] input');
  private readonly chartVersionInput = this.page.locator('[data-test="oci-chart-version"] input');

  // Footer buttons (shared between steps — same data-test-id)
  private readonly submitButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly resetButton = this.page.locator('[data-test-id="reset-button"]');

  // Validation error indicators
  private readonly validationErrors = this.page.locator('.pf-m-error');

  async navigateToUrlChart(namespace: string): Promise<void> {
    await this.goTo(`/helm/ns/${namespace}/url-chart`);
  }

  // --- Locator getters for assertions in specs ---

  getChartUrlInput(): Locator {
    return this.chartUrlInput;
  }

  getValidationErrors(): Locator {
    return this.validationErrors;
  }

  // --- Step 1 actions ---

  async enterChartUrl(url: string): Promise<void> {
    await this.chartUrlInput.fill(url);
  }

  async enterReleaseName(name: string): Promise<void> {
    await this.releaseNameInput.fill(name);
  }

  async enterChartVersion(version: string): Promise<void> {
    await this.chartVersionInput.fill(version);
  }

  async clickNext(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  // --- Step 2 actions ---

  async clickInstall(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async clickBack(): Promise<void> {
    await this.robustClick(this.resetButton);
  }
}
