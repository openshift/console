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
    await this.nameField.locator('input').clear();
    await this.nameField.locator('input').fill(name);
  }

  async fillDisplayName(name: string): Promise<void> {
    await this.displayNameField.locator('input').clear();
    await this.displayNameField.locator('input').fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionField.locator('input').clear();
    await this.descriptionField.locator('input').fill(description);
  }

  async fillUrl(url: string): Promise<void> {
    await this.urlField.locator('input').clear();
    await this.urlField.locator('input').fill(url);
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

  getChartRepositoriesFilter(): Locator {
    return this.page.getByText('Chart Repositories');
  }

  getFilterOption(name: string): Locator {
    return this.page.getByText(name);
  }

  async clickChartRepositoriesFilter(): Promise<void> {
    await this.robustClick(this.getChartRepositoriesFilter());
  }
}
