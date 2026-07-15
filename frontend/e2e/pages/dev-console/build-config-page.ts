import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class BuildConfigPage extends BasePage {
  async navigateToBuildConfigs(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/buildconfigs`);
  }

  async navigateToCreateForm(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/buildconfigs/~new/form`);
  }

  async navigateToEditForm(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/buildconfigs/${name}/form`);
  }

  getNameField(): Locator {
    return this.page.getByTestId('section name').getByRole('textbox', { name: 'Name' });
  }

  getSection(sectionName: string): Locator {
    return this.page.getByRole('heading', { name: sectionName, exact: true });
  }

  getGitRepoUrlLabel(): Locator {
    return this.page.getByText('Git Repo URL');
  }

  async expandAdvancedOption(optionName: string): Promise<void> {
    const toggle = this.page.getByRole('button', { name: optionName });
    await this.robustClick(toggle);
  }
}
