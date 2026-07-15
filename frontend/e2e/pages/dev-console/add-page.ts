import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class AddPage extends BasePage {
  private readonly viewAllSamplesLink: Locator = this.page.getByTestId('item all-samples');

  async navigateToAdd(namespace: string): Promise<void> {
    await this.goTo(`/add/ns/${namespace}`);
  }

  getViewAllSamples(): Locator {
    return this.viewAllSamplesLink;
  }

  getSampleCard(name: string): Locator {
    return this.page.getByTestId(`BuilderImage-${name}`);
  }

  getSampleCards(): Locator {
    // Prefix match required — each card has a unique data-test like "BuilderImage-Go" or "Devfile-nodejs"
    return this.page.locator('[data-test^="BuilderImage-"], [data-test^="Devfile-"]');
  }

  getPageHeading(): Locator {
    return this.page.getByTestId('page-heading').locator('h1');
  }

  getFormAppName(): Locator {
    return this.page.getByRole('textbox', { name: 'Name' });
  }

  getGitUrlInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Git Repo URL' });
  }

  getBuilderImageVersionToggle(): Locator {
    return this.page.getByTestId('console-select-menu-toggle');
  }

  getBuilderImageVersionItem(version: string): Locator {
    return this.page.getByTestId('console-select-item').filter({ hasText: version });
  }

  getSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create', exact: true });
  }

  getCancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel', exact: true });
  }

  async clickViewAllSamples(): Promise<void> {
    await this.robustClick(this.viewAllSamplesLink);
  }

  async clickSampleCard(name: string): Promise<void> {
    await this.robustClick(this.getSampleCard(name));
  }

  getPinnedResource(name: string): Locator {
    return this.getPinnedResourceItems().getByRole('link', { name });
  }
}
