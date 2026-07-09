import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage, { warmupSPA } from '../base-page';

export class AddPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading');
  private readonly gettingStartedResources: Locator = this.page.getByTestId(
    'getting-started-section',
  );
  private readonly detailsToggle: Locator = this.page.getByTestId('details-toggle');
  private readonly addToProjectButton: Locator = this.page.getByTestId('add-to-project-button');

  async navigateToAdd(namespace: string): Promise<void> {
    await this.goTo(`/add/ns/${namespace}`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async switchToDeveloper(): Promise<void> {
    await warmupSPA(this.page);
    await this.switchPerspective('Developer');
  }

  async ensureDevPerspectiveAndNavigate(namespace: string): Promise<void> {
    await warmupSPA(this.page);
    await this.switchPerspective('Developer');
    await this.navigateToAdd(namespace);
  }

  getCard(cardText: string): Locator {
    return this.page.getByTestId('card').filter({ hasText: cardText });
  }

  getOption(optionText: string): Locator {
    return this.page.getByTestId('item').filter({ hasText: optionText });
  }

  getGettingStartedResources(): Locator {
    return this.gettingStartedResources;
  }

  getDetailsToggle(): Locator {
    return this.detailsToggle;
  }

  async clickDetailsToggle(): Promise<void> {
    await this.robustClick(this.detailsToggle);
  }

  async clickShowGettingStartedResources(): Promise<void> {
    const link = this.page.getByRole('button', { name: /show getting started resources/i });
    await this.robustClick(link);
  }

  async hideGettingStartedFromKebab(): Promise<void> {
    const kebab = this.gettingStartedResources.getByTestId('kebab-button');
    await this.robustClick(kebab);
    const hideOption = this.page.getByRole('menuitem', { name: /hide from view/i });
    await this.robustClick(hideOption);
  }

  async clickAddToProject(): Promise<void> {
    await this.robustClick(this.addToProjectButton);
  }

  getQuickSearchInput(): Locator {
    return this.page.getByTestId('quick-search-bar');
  }

  async clickDatabaseCard(): Promise<void> {
    const databaseOption = this.getOption('Database');
    await this.robustClick(databaseOption);
  }

  async clickImportFromGit(): Promise<void> {
    const gitOption = this.getOption('Import from Git');
    await this.robustClick(gitOption);
  }

  async clickContainerImage(): Promise<void> {
    const option = this.getOption('Container images');
    await this.robustClick(option);
  }

  async clickImportYAML(): Promise<void> {
    const yamlOption = this.getOption('Import YAML');
    await this.robustClick(yamlOption);
  }

  async clickSamples(): Promise<void> {
    const samplesOption = this.getOption('Samples');
    await this.robustClick(samplesOption);
  }

  async clickUploadJARFile(): Promise<void> {
    const jarOption = this.getOption('Upload JAR file');
    await this.robustClick(jarOption);
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

  getAddCardItem(name: string): Locator {
    return this.page.getByText(name);
  }

  getViewAllLink(): Locator {
    return this.page.getByRole('link', { name: /view all/i });
  }

  getNoResultsMessage(): Locator {
    return this.page.getByText('No results');
  }
}

export class ImportFromGitPage extends BasePage {
  private readonly gitRepoUrlInput: Locator = this.page.getByTestId('git-form-input-url');
  private readonly appNameInput: Locator = this.page.getByTestId('application-form-app-input');
  private readonly nameInput: Locator = this.page.getByTestId('application-form-app-name');
  private readonly createButton: Locator = this.page.getByTestId('submit-button');
  private readonly cancelButton: Locator = this.page.getByTestId('reset-button');

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
    const normalizedType = type.toLowerCase().replace(/\s+/g, '');
    let testId: string;
    if (normalizedType === 'deployment' || normalizedType === 'deploy') {
      testId = 'deployment-radio-input';
    } else if (normalizedType === 'deploymentconfig' || normalizedType === 'deploy-config') {
      testId = 'deployment-config-radio-input';
    } else {
      testId = `${normalizedType}-radio-input`;
    }
    const radio = this.page.getByTestId(testId);
    await this.robustClick(radio);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  async uncheckCreateRoute(): Promise<void> {
    const routeCheckbox = this.page.getByTestId('route-checkbox');
    if (await routeCheckbox.isChecked()) {
      await routeCheckbox.uncheck();
    }
  }

  async clickAdvancedOption(optionText: string): Promise<void> {
    const link = this.page.getByRole('button', { name: new RegExp(optionText, 'i') });
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
    const input = this.page.getByTestId('devfile-path-input');
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
  private readonly imageNameInput: Locator = this.page.getByTestId('deploy-image-search-term');
  private readonly nameInput: Locator = this.page.getByTestId('application-form-app-name');
  private readonly appNameInput: Locator = this.page.getByTestId('application-form-app-input');
  private readonly createButton: Locator = this.page.getByTestId('submit-button');
  private readonly cancelButton: Locator = this.page.getByTestId('reset-button');
  private readonly saveButton: Locator = this.page.getByTestId('submit-button');

  async navigateToDeployImage(namespace: string): Promise<void> {
    await this.goTo(`/deploy-image/ns/${namespace}`);
    await expect(this.imageNameInput.or(this.page.getByTestId('image-stream-tag-radio'))).toBeVisible({ timeout: 60_000 });
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
    const radio = this.page.getByTestId('image-stream-tag-radio');
    await this.robustClick(radio);
  }

  async selectProject(projectName: string): Promise<void> {
    const dropdown = this.page.getByTestId('image-stream-project-dropdown');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: projectName, exact: true });
    await this.robustClick(option);
  }

  async selectImageStream(streamName: string): Promise<void> {
    const dropdown = this.page.getByTestId('image-stream-dropdown');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: streamName, exact: true });
    await this.robustClick(option);
  }

  async selectTag(tag: string): Promise<void> {
    const dropdown = this.page.getByTestId('image-stream-tag-dropdown');
    await this.robustClick(dropdown);
    const option = this.page.getByRole('option', { name: tag });
    await this.robustClick(option);
  }

  async selectRuntimeIcon(iconName: string): Promise<void> {
    const dropdown = this.page.getByTestId('runtime-icon-dropdown');
    await this.robustClick(dropdown);
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
    const normalizedType = type.toLowerCase().replace(/\s+/g, '');
    let testId: string;
    if (normalizedType === 'deployment' || normalizedType === 'deploy') {
      testId = 'deployment-radio-input';
    } else {
      testId = 'deployment-config-radio-input';
    }
    const radio = this.page.getByTestId(testId);
    await this.robustClick(radio);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  async clickSave(): Promise<void> {
    await this.robustClick(this.saveButton);
  }

  getAppNameInput(): Locator {
    return this.appNameInput;
  }

  getNameInput(): Locator {
    return this.nameInput;
  }
}

export class SoftwareCatalogPage extends BasePage {
  private readonly pageHeading: Locator = this.page.getByTestId('page-heading');
  private readonly filterInput: Locator = this.page.getByPlaceholder('Filter by keyword');

  async navigateToCatalog(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async navigateToAllNamespacesCatalog(): Promise<void> {
    await this.goTo('/catalog/all-namespaces');
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async navigateToTemplates(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}?catalogType=Template`);
    await expect(this.pageHeading).toBeVisible({ timeout: 60_000 });
  }

  async selectTypeOption(typeName: string): Promise<void> {
    const typeFilter = this.page.getByTestId(`catalog-${typeName}`);
    if ((await typeFilter.count()) > 0) {
      await this.robustClick(typeFilter);
      return;
    }
    // data-test-group-item: legacy attr from CatalogServiceProvider (no React source to add data-test)
    const checkbox = this.page.locator(`[data-test-group-item="${typeName}"]`);
    if ((await checkbox.count()) > 0) {
      await this.robustClick(checkbox);
      return;
    }
    // Final fallback: text-based
    const link = this.page.getByRole('link', { name: typeName });
    await this.robustClick(link);
  }

  async selectTemplateCategory(category: string): Promise<void> {
    const categoryFilter = this.page.getByTestId(`category-${category}`);
    if ((await categoryFilter.count()) > 0) {
      await this.robustClick(categoryFilter);
      return;
    }
    const categoryLink = this.page.getByRole('link', { name: category, exact: true });
    await this.robustClick(categoryLink);
  }

  async searchAndSelectCard(cardName: string): Promise<void> {
    await this.filterInput.fill(cardName);
    // Wait for filtered results to render
    const card = this.page.getByTestId(`catalog-tile-${cardName}`);
    // co-catalog-tile: Console's catalog tile class from CatalogTile.tsx
    const fallbackCard = this.page.locator('.co-catalog-tile').filter({ hasText: cardName });
    const anyResult = card.or(fallbackCard.first());
    await expect(anyResult).toBeVisible({ timeout: 10_000 });
    if ((await card.count()) > 0) {
      await this.robustClick(card);
      return;
    }
    await this.robustClick(fallbackCard.first());
  }

  async clickInstantiateTemplate(): Promise<void> {
    const button = this.page.getByRole('link', { name: /instantiate template/i });
    if ((await button.count()) > 0) {
      await this.robustClick(button);
      return;
    }
    const fallbackBtn = this.page.getByTestId('instantiate-template-btn');
    await this.robustClick(fallbackBtn);
  }

  async clickCreateApplicationButton(): Promise<void> {
    const button = this.page.getByRole('link', { name: /create application/i });
    await this.robustClick(button);
  }

  async filterByKeyword(keyword: string): Promise<void> {
    await this.filterInput.fill(keyword);
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getFilterInput(): Locator {
    return this.filterInput;
  }

  getHelpText(text: string): Locator {
    return this.page.getByText(text);
  }

  getCatalogTiles(): Locator {
    // co-catalog-tile: Console's catalog tile class from CatalogTile.tsx
    return this.page.locator('.co-catalog-tile');
  }

  getFormSubmitButton(): Locator {
    return this.page.getByTestId('submit-button');
  }

  getProjectSelectionMessage(): Locator {
    return this.page.getByText('Select a Project to view the software catalog');
  }
}

export class ImportYAMLPage extends BasePage {
  private readonly submitButton: Locator = this.page.getByTestId('submit-button');
  private readonly cancelButton: Locator = this.page.getByTestId('reset-button');

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

export class TopologyPage extends BasePage {
  async navigateToTopology(namespace: string): Promise<void> {
    await this.goTo(`/topology/ns/${namespace}`);
    await this.waitForLoadingComplete(30_000);
  }

  getWorkload(name: string): Locator {
    return this.page.getByTestId(`topology-node-${name}`);
  }

  async clickWorkload(name: string): Promise<void> {
    const node = this.getWorkload(name);
    await this.robustClick(node);
  }

  getSidebar(): Locator {
    return this.page.getByTestId('topology-sidebar');
  }

  getSidebarTitle(): Locator {
    return this.page.getByTestId('resource-title');
  }

  async waitForWorkload(name: string, timeoutMs = 120_000): Promise<void> {
    const workload = this.getWorkload(name);
    // eslint-disable-next-line no-restricted-syntax
    await workload.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async switchToListView(): Promise<void> {
    const listViewBtn = this.page.getByTestId('topology-list-view');
    if ((await listViewBtn.count()) > 0) {
      await this.robustClick(listViewBtn);
    }
  }
}
