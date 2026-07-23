import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class AddFlowPage extends BasePage {
  private readonly gitUrlInput = this.page.locator('#form-input-git-url-field');
  private readonly componentNameInput = this.page.locator('#form-input-name-field');
  private readonly appNameInput = this.page.locator('#form-input-application-name-field');
  private readonly createButton = this.page.getByTestId('save-changes');
  private readonly resourcesDropdown = this.page.locator(
    '#form-select-input-resources-field',
  );
  private readonly knativeResourceOption = this.page.locator(
    '#select-option-resources-knative',
  );
  private readonly importStrategyEditButton = this.page.getByTestId('import-strategy-button');
  private readonly dockerfileStrategy = this.page.getByTestId('import-strategy-Dockerfile');
  private readonly dockerfilePathInput = this.page.locator(
    '#form-input-docker-dockerfilePath-field',
  );
  private readonly externalRegistryInput = this.page.locator(
    '#form-input-searchTerm-field',
  );
  private readonly pageHeading = this.page.getByTestId('page-heading').locator('h1');

  async navigateToAddPage(namespace: string): Promise<void> {
    await this.goTo(`/add/ns/${namespace}`);
    await this.waitForLoadingComplete();
  }

  async clickCard(cardId: string): Promise<void> {
    const card = this.page.getByTestId(`item ${cardId}`);
    await card.scrollIntoViewIfNeeded();
    await this.robustClick(card);
    await this.waitForLoadingComplete();
  }

  async clickImportFromGitCard(): Promise<void> {
    await this.clickCard('import-from-git');
  }

  async clickContainerImageCard(): Promise<void> {
    await this.clickCard('deploy-image');
  }

  async enterGitUrl(url: string): Promise<void> {
    await this.gitUrlInput.clear();
    await this.gitUrlInput.fill(url);
    await expect(
      this.page.locator('.pf-v6-c-helper-text').filter({ hasText: /Validated|Rate limit/ }).first(),
    ).toBeVisible({ timeout: 60_000 });

    // If rate limited, auto-detection fails — manually select Builder Image strategy and Node.js
    const rateLimitMsg = this.page.getByText('Rate limit exceeded');
    if ((await rateLimitMsg.count()) > 0) {
      // Select "Builder Image" import strategy
      const builderImageStrategy = this.page.getByTestId('import-strategy-Builder Image');
      if ((await builderImageStrategy.count()) > 0) {
        await this.robustClick(builderImageStrategy);
      }
      // Wait for builder image list to load, then select Node.js
      const nodeJsImage = this.page.locator('[data-test^="card "]').filter({ hasText: 'Node.js' });
      if ((await nodeJsImage.count()) > 0) {
        await this.robustClick(nodeJsImage.first());
      }
    }
  }

  async enterComponentName(name: string): Promise<void> {
    await this.componentNameInput.scrollIntoViewIfNeeded();
    await this.componentNameInput.click();
    await this.componentNameInput.clear();
    await this.componentNameInput.fill(name);
    await expect(this.componentNameInput).toHaveValue(name);
  }

  async enterAppName(name: string): Promise<void> {
    await this.appNameInput.clear();
    await this.appNameInput.fill(name);
  }

  async selectServerlessDeployment(): Promise<void> {
    await this.resourcesDropdown.scrollIntoViewIfNeeded();
    await this.robustClick(this.resourcesDropdown);
    await this.robustClick(this.knativeResourceOption);
  }

  async clickCreate(): Promise<void> {
    await this.createButton.scrollIntoViewIfNeeded();
    await expect(async () => {
      await expect(this.createButton).toBeEnabled();
    }).toPass({ timeout: 90_000, intervals: [1_000, 2_000, 5_000] });
    await this.robustClick(this.createButton);
    await this.waitForLoadingComplete();
  }

  async enterExternalRegistryImageName(imageName: string): Promise<void> {
    await this.externalRegistryInput.clear();
    await this.externalRegistryInput.fill(imageName);
    await expect(
      this.page.locator('.pf-v6-c-helper-text').filter({ hasText: /Validated|Loading/ }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(this.componentNameInput).not.toHaveValue('', { timeout: 30_000 });
  }

  async selectBuilderImage(name: string): Promise<void> {
    const strategy = this.page.getByTestId('import-strategy-Builder Image');
    if ((await strategy.count()) > 0) {
      await this.robustClick(strategy);
      const card = this.page.locator('[data-test^="card "]').filter({ hasText: name });
      if ((await card.count()) > 0) {
        await this.robustClick(card.first());
      }
    }
  }

  async clickEditImportStrategy(): Promise<void> {
    await this.robustClick(this.importStrategyEditButton);
  }

  async selectDockerfileStrategy(): Promise<void> {
    await this.robustClick(this.dockerfileStrategy);
  }

  async enterDockerfilePath(dockerfilePath: string): Promise<void> {
    await this.dockerfilePathInput.clear();
    await this.dockerfilePathInput.fill(dockerfilePath);
  }

  getKnativeServiceOption(): Locator {
    return this.knativeResourceOption;
  }

  getResourceTypeDropdown(): Locator {
    return this.resourcesDropdown;
  }

  getHeading(): Locator {
    return this.pageHeading;
  }
}
