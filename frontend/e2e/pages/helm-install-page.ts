import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class HelmInstallPage extends BasePage {
  private readonly pageTitle: Locator;
  private readonly releaseNameInput: Locator;
  private readonly formViewRadio: Locator;
  private readonly yamlViewRadio: Locator;
  private readonly createButton: Locator;
  private readonly formSections: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = this.page.getByRole('heading', { name: /Create Helm Release/i });
    this.releaseNameInput = this.page.locator('[data-test="release-name"]');
    this.formViewRadio = this.page.getByRole('radio', { name: 'Form view' });
    this.yamlViewRadio = this.page.getByRole('radio', { name: 'YAML view' });
    this.createButton = this.page.getByTestId('save-changes');
    this.formSections = this.page.locator('.form-group');
  }

  async verifyPageDisplayed(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async verifyDefaultReleaseName(expectedName: string): Promise<void> {
    await expect(this.releaseNameInput).toHaveValue(expectedName);
  }

  async verifyFormViewSelected(): Promise<void> {
    await expect(this.formViewRadio).toBeChecked();
  }

  async verifyYamlViewEnabled(): Promise<void> {
    await expect(this.yamlViewRadio).toBeEnabled();
  }

  async verifyFormSectionsDisplayed(): Promise<void> {
    const count = await this.formSections.count();
    expect(count).toBeGreaterThan(0);
  }

  async enterReleaseName(name: string): Promise<void> {
    await this.releaseNameInput.clear();
    await this.releaseNameInput.fill(name);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton);
    // Wait for navigation after creating Helm chart
    await this.waitForLoadingComplete(120_000);
  }

  async selectYamlView(): Promise<void> {
    await this.robustClick(this.yamlViewRadio);
  }

  /**
   * Complete workflow: Install Helm chart from Software Catalog
   */
  async installHelmChartFromCatalog(
    chartName: string,
    releaseName: string,
    namespace: string,
  ): Promise<void> {
    // Navigate to catalog
    await this.goTo(`/catalog/ns/${namespace}`);
    await this.waitForLoadingComplete();

    // Select Helm Charts type
    const helmChartsLink = this.page.getByRole('link', { name: /Helm Charts/ });
    await this.robustClick(helmChartsLink);
    await this.waitForLoadingComplete(60_000);

    // Search and select chart
    const searchInput = this.page.getByPlaceholder(/Filter by keyword/i);
    await searchInput.fill(chartName);
    await this.waitForLoadingComplete(60_000);

    const chartCard = this.page
      .locator('.odc-catalog-tile')
      .filter({ hasText: chartName })
      .first();
    await this.robustClick(chartCard);

    // Click Create on sidebar
    const createOnSidebar = this.page
      .locator('[role="dialog"]')
      .getByRole('button', { name: /Create/i });
    await this.robustClick(createOnSidebar);
    await this.waitForLoadingComplete();

    // Enter release name
    await this.enterReleaseName(releaseName);

    // Click Create
    await this.clickCreate();
  }
}
