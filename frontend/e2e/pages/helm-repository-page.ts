import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class HelmRepositoryPage extends BasePage {
  private readonly scopeProjectRadio = this.page.getByTestId(
    'ProjectHelmChartRepository-view-input',
  );
  private readonly scopeClusterRadio = this.page.getByTestId('HelmChartRepository-view-input');
  private readonly nameField = this.page.getByTestId('repo-name');
  private readonly displayNameField = this.page.getByTestId('repo-display-name');
  private readonly descriptionField = this.page.getByTestId('repo-description');
  private readonly urlField = this.page.getByTestId('repo-url');
  private readonly disabledCheckbox = this.page.getByTestId('repo-disabled');
  private readonly submitButton = this.page.getByTestId('save-changes');
  private readonly cancelButton = this.page.getByTestId('reset-button');
  private readonly repositoriesList = this.page.getByTestId('repositories-list');
  private readonly projectRepoList = this.page.getByTestId('project-helm-chart-repositories-list');

  async navigateToCreateForm(namespace: string): Promise<void> {
    await this.goTo(`/helm-repositories/ns/${namespace}/~new/form`);
  }

  getRepositoriesList(): Locator {
    return this.repositoriesList;
  }

  getProjectRepoList(): Locator {
    return this.projectRepoList;
  }

  getScopeProjectRadio(): Locator {
    return this.scopeProjectRadio;
  }

  getScopeClusterRadio(): Locator {
    return this.scopeClusterRadio;
  }

  async selectProjectScope(): Promise<void> {
    await this.scopeProjectRadio.check();
  }

  async selectClusterScope(): Promise<void> {
    await this.scopeClusterRadio.check();
  }

  async fillName(name: string): Promise<void> {
    await this.nameField.clear();
    await this.nameField.fill(name);
  }

  async fillDisplayName(name: string): Promise<void> {
    await this.displayNameField.clear();
    await this.displayNameField.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionField.clear();
    await this.descriptionField.fill(description);
  }

  async fillUrl(url: string): Promise<void> {
    await this.urlField.clear();
    await this.urlField.fill(url);
  }

  async clickCreate(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async clickSave(): Promise<void> {
    await this.robustClick(this.submitButton);
  }

  async clickCancel(): Promise<void> {
    await this.robustClick(this.cancelButton);
  }

  getRepositoryRow(name: string): Locator {
    return this.page.locator('tr', { hasText: name });
  }

  async clickKebabForRepository(name: string): Promise<void> {
    const kebab = this.getRepositoryRow(name).getByTestId('kebab-button');
    await this.robustClick(kebab);
  }

  async clickEditAction(resourceType: string): Promise<void> {
    await this.robustClick(this.page.getByTestId(`Edit ${resourceType}`));
  }

}
