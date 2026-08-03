import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class HelmURLChartPage extends BasePage {
  // Step 1: URL chart form
  private readonly chartUrlField = this.page.getByTestId('oci-chart-url');
  private readonly releaseNameField = this.page.getByTestId('oci-release-name');
  private readonly chartVersionField = this.page.getByTestId('oci-chart-version');

  // Step 2: Install form (disabled read-only fields)
  private readonly step2ChartUrl = this.page.getByTestId('chart-url');
  private readonly step2ReleaseName = this.page.getByTestId('release-name');
  private readonly step2ChartVersion = this.page.getByTestId('chart-version');

  private readonly submitButton = this.page.getByTestId('save-changes');
  private readonly cancelButton = this.page.getByTestId('reset-button');
  private readonly formHeader = this.page.getByTestId('form-title');
  private readonly nonConfigurableAlert = this.page.getByText(
    "Helm release is not configurable since the Helm Chart doesn't define any values.",
  );
  private readonly urlValidationError = this.page.getByText('Invalid chart URL format');

  async navigateToUrlChart(namespace: string): Promise<void> {
    await this.goTo(`/helm/ns/${namespace}/url-chart`);
  }

  getChartUrlField(): Locator {
    return this.chartUrlField;
  }

  getReleaseNameField(): Locator {
    return this.releaseNameField;
  }

  getChartVersionField(): Locator {
    return this.chartVersionField;
  }

  getStep2ChartUrl(): Locator {
    return this.step2ChartUrl;
  }

  getStep2ReleaseName(): Locator {
    return this.step2ReleaseName;
  }

  getStep2ChartVersion(): Locator {
    return this.step2ChartVersion;
  }

  getFormHeader(): Locator {
    return this.formHeader;
  }

  getNonConfigurableAlert(): Locator {
    return this.nonConfigurableAlert;
  }

  getSubmitButton(): Locator {
    return this.submitButton;
  }

  getUrlValidationError(): Locator {
    return this.urlValidationError;
  }

  async fillChartUrl(url: string): Promise<void> {
    await this.chartUrlField.locator('input').clear();
    await this.chartUrlField.locator('input').fill(url);
  }

  async fillReleaseName(name: string): Promise<void> {
    await this.releaseNameField.locator('input').clear();
    await this.releaseNameField.locator('input').fill(name);
  }

  async fillChartVersion(version: string): Promise<void> {
    await this.chartVersionField.locator('input').clear();
    await this.chartVersionField.locator('input').fill(version);
  }

  async clickNext(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async clickInstall(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  async clickBack(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }
}
