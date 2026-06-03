import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class SoftwareCatalogPage extends BasePage {
  private readonly catalogTitle: Locator;
  private readonly helmChartsTypeButton: Locator;
  private readonly searchInput: Locator;
  private readonly catalogCards: Locator;

  constructor(page: Page) {
    super(page);
    this.catalogTitle = this.page.getByRole('heading', { name: /Software Catalog/i });
    this.helmChartsTypeButton = this.page.getByRole('link', { name: /Helm Charts/ });
    this.searchInput = this.page.getByPlaceholder(/Filter by keyword/i);
    this.catalogCards = this.page.locator('.odc-catalog-tile');
  }

  async navigateToCatalog(namespace?: string): Promise<void> {
    if (namespace) {
      await this.goTo(`/catalog/ns/${namespace}`);
    } else {
      await this.goTo('/catalog/all-namespaces');
    }
    await this.waitForLoadingComplete();
  }

  async verifyTitle(): Promise<void> {
    await expect(this.catalogTitle).toBeVisible();
  }

  async selectHelmChartsType(): Promise<void> {
    await this.robustClick(this.helmChartsTypeButton);
    await this.waitForLoadingComplete(60_000);
  }

  async isCardsDisplayed(): Promise<void> {
    await expect(this.catalogCards.first()).toBeVisible({ timeout: 60_000 });
  }

  async searchAndSelectChart(chartName: string): Promise<void> {
    await this.searchInput.fill(chartName);
    await this.waitForLoadingComplete();

    const chartCard = this.catalogCards.filter({ hasText: chartName }).first();
    await this.robustClick(chartCard);
  }

  async clickButtonOnCatalogPageSidePane(): Promise<void> {
    const createButton = this.page
      .locator('[role="dialog"]')
      .getByRole('button', { name: /Create/i });
    await this.robustClick(createButton);
  }

  async clickCreateButton(): Promise<void> {
    const createButton = this.page.getByRole('button', { name: 'Create' });
    await this.robustClick(createButton);
    await this.waitForLoadingComplete();
  }
}
