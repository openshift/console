import type { Locator } from '@playwright/test';

import type KubernetesClient from '../../clients/kubernetes-client';
import { expect } from '../../fixtures';
import BasePage, { ensureDeveloperPerspective, warmupSPA } from '../base-page';

export class AddPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading');
  private readonly gettingStartedResources: Locator = this.page.getByTestId('getting-started');
  private readonly detailsSwitch: Locator = this.page.getByTestId('details-switch');

  async navigateToAdd(namespace: string): Promise<void> {
    await this.goTo(`/add/ns/${namespace}`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async switchToDeveloper(): Promise<void> {
    await warmupSPA(this.page);
    await this.switchPerspective('Developer');
  }

  async ensureDevPerspectiveAndNavigate(
    namespace: string,
    k8sClient?: KubernetesClient,
  ): Promise<void> {
    await warmupSPA(this.page);
    if (k8sClient) {
      await ensureDeveloperPerspective(this.page, k8sClient);
    }
    await this.switchPerspective('Developer');
    await this.navigateToAdd(namespace);
  }

  getCard(cardId: string): Locator {
    return this.page.getByTestId(`card ${cardId}`);
  }

  getCardItem(itemId: string): Locator {
    return this.page.getByTestId(`item ${itemId}`);
  }

  getGettingStartedResources(): Locator {
    return this.gettingStartedResources;
  }

  getDetailsSwitch(): Locator {
    return this.detailsSwitch;
  }

  async clickDetailsSwitch(): Promise<void> {
    await this.robustClick(this.detailsSwitch.locator('input'));
  }

  async hideGettingStarted(): Promise<void> {
    const closeButton = this.gettingStartedResources.getByRole('button', { name: 'Close' });
    await this.robustClick(closeButton);
  }

  getQuickSearchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Quick search bar' });
  }

  async clickAddToProject(): Promise<void> {
    await this.robustClick(this.page.getByTestId('quick-search'));
  }

  async clickImportFromGit(): Promise<void> {
    await this.robustClick(this.getCardItem('import-from-git'));
  }

  async clickContainerImage(): Promise<void> {
    await this.robustClick(this.getCardItem('deploy-image'));
  }

  async clickDatabaseCard(): Promise<void> {
    await this.robustClick(this.getCardItem('dev-catalog-databases'));
  }

  async clickImportYAML(): Promise<void> {
    await this.robustClick(this.getCardItem('import-yaml'));
  }

  async clickSamples(): Promise<void> {
    await this.robustClick(this.getCardItem('import-from-samples'));
  }

  async clickViewAllSamples(): Promise<void> {
    const viewAll = this.page.getByRole('link', { name: /view all samples/i });
    await this.robustClick(viewAll);
  }

  getViewAllSamples(): Locator {
    return this.page.getByRole('link', { name: /view all samples/i });
  }

  getSampleCard(name: string): Locator {
    return this.page.getByTestId(`sample-${name}`);
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getAddCardHeading(name: string): Locator {
    return this.page.getByTestId('add-cards').getByRole('heading', { level: 2, name, exact: true });
  }

  getViewAllLink(): Locator {
    return this.page.getByRole('link', { name: /view all/i });
  }

  getNoResultsMessage(): Locator {
    return this.page.getByText('No results');
  }

  getSampleCards(): Locator {
    return this.page.locator('[data-test^="BuilderImage-"], [data-test^="Devfile-"]');
  }

  async clickSampleCard(name: string): Promise<void> {
    await this.robustClick(this.page.getByTestId(`BuilderImage-${name}`));
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

  getPinnedResource(name: string): Locator {
    return this.page
      .getByRole('region', { name: 'Pinned resources' })
      .getByRole('link', { name });
  }
}
export class ImportFromGitPage extends BasePage {
  private readonly gitRepoUrlInput: Locator = this.page.getByRole('textbox', {
    name: 'Git Repo URL',
  });
  private readonly appNameInput: Locator = this.page.getByTestId('application-form-app-input');
  private readonly nameInput: Locator = this.page.getByTestId('application-form-app-name');
  private readonly createButton: Locator = this.page.getByRole('button', { name: 'Create', exact: true });
  private readonly cancelButton: Locator = this.page.getByRole('button', { name: 'Cancel', exact: true });

  async navigateToImportFromGit(namespace: string): Promise<void> {
    await this.goTo(`/import/ns/${namespace}`);
    await expect(this.gitRepoUrlInput).toBeVisible({ timeout: 60_000 });
  }

  async enterGitRepoURL(url: string): Promise<void> {
    await this.gitRepoUrlInput.fill(url);
  }

  async waitForGitValidation(): Promise<void> {
    const validatedIndicator = this.page.getByTestId('git-url-validated');
    const errorIndicator = this.page.getByTestId('git-url-error');
    try {
      // eslint-disable-next-line no-restricted-syntax
      await validatedIndicator.or(errorIndicator).first().waitFor({ timeout: 30_000 });
    } catch {
      // Validation may not always appear for non-standard git types
    }
  }

  async enterApplicationName(name: string): Promise<void> {
    await this.appNameInput.clear();
    await this.appNameInput.fill(name);
  }

  async enterName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async selectResourceType(type: string): Promise<void> {
    const toggle = this.page.locator('#form-select-input-resources-field');
    const currentValue = (await toggle.textContent())?.trim() || '';
    if (currentValue === type) return;
    await this.robustClick(toggle, { timeout: 30_000 });
    const option = this.page.getByRole('option', { name: new RegExp(`^${type}\\b`) });
    await this.robustClick(option);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  async uncheckCreateRoute(): Promise<void> {
    const routeCheckbox = this.page.getByRole('checkbox', { name: /create a route/i });
    if (await routeCheckbox.isChecked()) {
      await routeCheckbox.uncheck();
    }
  }

  async clickAdvancedOption(optionText: string): Promise<void> {
    const link = this.page.getByRole('button', { name: optionText });
    await this.robustClick(link);
  }

  async enterWorkloadName(name: string): Promise<void> {
    await this.enterName(name);
  }

  async ensureFormView(): Promise<void> {
    const formViewButton = this.page.getByTestId('form-view-input');
    if ((await formViewButton.count()) > 0) {
      const isChecked = await formViewButton.isChecked();
      if (!isChecked) {
        await this.robustClick(formViewButton);
      }
    }
  }

  getDevfileStrategyDisabled(): Locator {
    return this.page
      .getByTestId('import-strategy-Devfile')
      .and(this.page.locator('[aria-disabled="true"]'));
  }

  getDevfileStrategySelected(): Locator {
    return this.page
      .getByTestId('import-strategy-Devfile')
      .and(this.page.locator('[class*="selected"], [aria-pressed="true"], .pf-m-selected'));
  }

  getDevfileDetectedHeading(): Locator {
    return this.page.locator('h2', { hasText: /nodejs|devfile/i });
  }

  async clickEditImportStrategy(): Promise<void> {
    const editBtn = this.page.getByRole('button', { name: /edit import strategy/i });
    await this.robustClick(editBtn);
  }

  async selectBuilderImage(imageName: string): Promise<void> {
    const imageCard = this.page.getByTestId(`card ${imageName}`);
    await this.robustClick(imageCard);
  }

  async selectImportStrategyBuilderImage(): Promise<void> {
    const radio = this.page.getByTestId('import-strategy-Builder Image');
    await this.robustClick(radio);
  }

  async enterDevfilePath(path: string): Promise<void> {
    const input = this.page.getByTestId('git-form-devfile-path-input');
    await input.clear();
    await input.fill(path);
  }

  async selectGitType(gitType: string): Promise<void> {
    const dropdown = this.page.getByTestId('git-type-dropdown');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: gitType });
    await this.robustClick(option);
  }

  getAppNameInput(): Locator {
    return this.appNameInput;
  }

  getNameInput(): Locator {
    return this.nameInput;
  }

  getDevfileNotDetectedMessage(): Locator {
    return this.page.getByText('Devfile not detected');
  }
}

export class DeployImagePage extends BasePage {
  private readonly imageNameInput: Locator = this.page.getByRole('textbox', { name: 'Image name' });
  private readonly nameInput: Locator = this.page.getByTestId('application-form-app-name');
  private readonly appNameInput: Locator = this.page.getByTestId('application-form-app-input');
  private readonly createButton: Locator = this.page.getByRole('button', { name: 'Create', exact: true });
  private readonly cancelButton: Locator = this.page.getByRole('button', { name: 'Cancel', exact: true });

  async navigateToDeployImage(namespace: string): Promise<void> {
    await this.goTo(`/deploy-image/ns/${namespace}`);
    await expect(this.imageNameInput.or(this.page.getByTestId('internal-view-input')).first()).toBeVisible({ timeout: 60_000 });
  }

  async enterExternalRegistryImage(imageName: string): Promise<void> {
    const externalRadio = this.page.getByTestId('image-name-radio');
    if ((await externalRadio.count()) > 0) {
      await this.robustClick(externalRadio);
    }
    await this.imageNameInput.fill(imageName);
    // Wait for image lookup to complete by checking that the name field auto-populates
    await expect(this.nameInput).not.toHaveValue('', { timeout: 30_000 });
  }

  async selectImageStreamTag(): Promise<void> {
    const radio = this.page.getByTestId('internal-view-input');
    await this.robustClick(radio);
  }

  // Image stream dropdowns all share data-test="console-select-menu-toggle"
  // so Formik-generated IDs are the only way to distinguish them
  async selectProject(projectName: string): Promise<void> {
    const dropdown = this.page.locator('#form-ns-dropdown-imageStream-namespace-field');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: projectName, exact: true });
    await this.robustClick(option);
  }

  async selectImageStream(streamName: string): Promise<void> {
    const dropdown = this.page.locator('#form-ns-dropdown-imageStream-image-field');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: streamName, exact: true });
    await this.robustClick(option);
  }

  async selectTag(tag: string): Promise<void> {
    const dropdown = this.page.locator('#form-dropdown-imageStream-tag-field');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: tag });
    await this.robustClick(option);
  }

  async selectRuntimeIcon(iconName: string): Promise<void> {
    const iconToggle = this.page.locator('.odc-icon-dropdown').getByTestId('console-select-menu-toggle');
    await this.robustClick(iconToggle, { timeout: 30_000 });
    const option = this.page.getByRole('option', { name: iconName });
    await this.robustClick(option);
  }

  async selectApplication(appName: string): Promise<void> {
    const dropdown = this.page.getByTestId('application-form-app-dropdown');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: appName });
    await this.robustClick(option);
  }

  async enterName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async enterApplicationName(name: string): Promise<void> {
    await this.appNameInput.clear();
    await this.appNameInput.fill(name);
  }

  async selectResourceType(type: string): Promise<void> {
    const toggle = this.page.locator('#form-select-input-resources-field');
    const currentValue = (await toggle.textContent())?.trim() || '';
    if (currentValue === type) return;
    await this.robustClick(toggle, { timeout: 30_000 });
    const option = this.page.getByRole('option', { name: new RegExp(`^${type}\\b`) });
    await this.robustClick(option);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  getAppNameInput(): Locator {
    return this.appNameInput;
  }

  getNameInput(): Locator {
    return this.nameInput;
  }
}

export class ImportYAMLPage extends BasePage {
  private readonly submitButton: Locator = this.page.getByRole('button', { name: 'Create', exact: true });
  private readonly cancelButton: Locator = this.page.getByRole('button', { name: 'Cancel', exact: true });

  getSubmitButton(): Locator {
    return this.submitButton;
  }

  getCancelButton(): Locator {
    return this.cancelButton;
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }
}

