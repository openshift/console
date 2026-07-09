import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class BuildConfigPage extends BasePage {
  async navigateToBuildConfigs(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/buildconfigs`);
  }

  async navigateToEditForm(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/buildconfigs/${name}/form`);
  }

  getNameField(): Locator {
    // TODO: use getByTestId('form-name-input') after CONSOLE-5299 merges
    return this.page.locator('#form-input-formData-name-field');
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

  async ensureFormView(): Promise<void> {
    const syncedEditor = this.getSyncedEditor();
    // eslint-disable-next-line no-restricted-syntax
    await syncedEditor.waitFor({ state: 'visible', timeout: 30_000 });
    const formRadio = this.getEditorRadio('Form view');
    if (!(await formRadio.isChecked())) {
      await formRadio.click();
      await this.waitForLoadingComplete();
    }
  }
}
