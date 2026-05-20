import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class SamplesPage extends BasePage {
  private readonly pageHeading = this.page.locator('[data-test="page-heading"] h1');
  private readonly viewAllSamplesLink = this.page.getByTestId('view-all-samples');
  private readonly samplesCard = this.page.getByTestId('card Samples');
  private readonly nameInput = this.page.locator('[data-test-id="application-form-app-name"]');
  private readonly gitUrlInput = this.page.locator('[data-test-id="git-form-input-url"]');
  private readonly builderImageVersionToggle = this.page.getByTestId('console-select-menu-toggle');
  private readonly submitButton = this.page.locator('[data-test-id="submit-button"]');
  private readonly cancelButton = this.page.locator('[data-test-id="reset-button"]');
  private readonly devfileName = this.page.locator(
    '[data-test-id="import-devfile"] #form-input-name-field',
  );

  constructor(page: Page) {
    super(page);
  }

  async clickViewAllSamples(): Promise<void> {
    await this.robustClick(this.viewAllSamplesLink);
  }

  async expectSamplesPageHeading(): Promise<void> {
    await expect(this.pageHeading).toContainText('Sample');
  }

  async clickSamplesCard(): Promise<void> {
    await this.robustClick(this.samplesCard);
  }

  async searchAndSelectSample(sampleName: string): Promise<void> {
    const searchInput = this.page.locator('[data-test="search-catalog"]');
    await searchInput.fill(sampleName);
    const card = this.page.locator(`[data-test^="${sampleName}"]`).first();
    await this.robustClick(card);
  }

  async selectSampleCard(sampleName: string): Promise<void> {
    const card = this.page.locator(`[data-test="${sampleName}"]`).first();
    if ((await card.count()) === 0) {
      const altCard = this.page.locator(`[data-test*="${sampleName}"]`).first();
      await this.robustClick(altCard);
    } else {
      await this.robustClick(card);
    }
  }

  async expectFormHeader(headerText: string): Promise<void> {
    await expect(this.pageHeading).toContainText(headerText);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async expectNameSectionVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
  }

  async expectBuilderImageVersionDropdownVisible(): Promise<void> {
    await expect(this.builderImageVersionToggle).toBeVisible();
  }

  async expectBuilderImageVisible(): Promise<void> {
    await expect(this.page.locator('img[alt="Icon"]')).toBeVisible();
  }

  async expectGitUrlReadonly(): Promise<void> {
    await expect(this.gitUrlInput).toBeVisible();
  }

  async expectCreateAndCancelButtons(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async changeBuilderImageVersion(version: string): Promise<void> {
    await this.robustClick(this.builderImageVersionToggle);
    await this.robustClick(
      this.page.getByTestId('console-select-item').filter({ hasText: version }),
    );
  }

  async fillDevfileName(name: string): Promise<void> {
    await this.waitForLoadingComplete();
    await this.devfileName.waitFor({ state: 'visible', timeout: 30_000 });
    await this.devfileName.clear();
    await this.devfileName.fill(name);
  }

  async expectSampleApplicationsVisible(): Promise<void> {
    await expect(this.page.locator('[data-test*="Devfile"]').first()).toBeVisible();
    await expect(this.page.locator('[data-test*="BuilderImage"]').first()).toBeVisible();
  }

  async expectBuilderImageBasedSamples(): Promise<void> {
    const count = await this.page.locator('[data-test^="BuilderImage"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  }
}
