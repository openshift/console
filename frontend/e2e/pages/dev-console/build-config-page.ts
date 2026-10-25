import type { Locator } from '@playwright/test';

import { expect } from '../../fixtures';
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

  getGitRepoUrlInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Git Repo URL' });
  }

  getEnvironmentSection(): Locator {
    return this.page.getByTestId('section environment-variables');
  }

  getEnvironmentVariableNames(): Locator {
    return this.getEnvironmentSection().getByTestId('pairs-list-name');
  }

  getEnvironmentVariableValues(): Locator {
    return this.getEnvironmentSection().getByTestId('pairs-list-value');
  }

  getImageOption(type: 'build-from' | 'push-to'): Locator {
    return this.page.getByTestId(`${type} type`);
  }

  getImageInput(
    type: 'build-from' | 'push-to',
    input: 'image-stream-image' | 'docker-image',
  ): Locator {
    return this.page.getByTestId(`${type} ${input}`);
  }

  getImageStreamTagSection(type: 'build-from' | 'push-to'): Locator {
    return this.page.getByTestId(`${type} image-stream-tag`);
  }

  getContextDirInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Context dir' });
  }

  async selectImageOption(type: 'build-from' | 'push-to', option: string): Promise<void> {
    await this.robustClick(this.getImageOption(type));
    await this.robustClick(this.page.getByRole('option', { name: option, exact: true }));
  }

  async selectImageStreamTag(
    type: 'build-from' | 'push-to',
    project: string,
    imageStream: string,
    tag: string,
  ): Promise<void> {
    await this.selectImageOption(type, 'Image Stream Tag');
    const section = this.getImageStreamTagSection(type);
    for (const [label, value] of [
      ['Project', project],
      ['Image Stream', imageStream],
      ['Tag', tag],
    ]) {
      await this.robustClick(section.getByRole('button', { name: label }));
      await this.robustClick(this.page.getByRole('option', { name: value, exact: true }));
    }
  }

  async expandAdvancedGitOptions(): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: /advanced Git options/i }));
    await expect(this.getContextDirInput()).toBeVisible({ timeout: 30_000 });
  }

  async addEnvironmentVariable(name: string, value: string): Promise<void> {
    const section = this.getEnvironmentSection();
    await this.robustClick(section.getByTestId('add-button'));
    await this.getEnvironmentVariableNames().last().fill(name);
    await this.getEnvironmentVariableValues().last().fill(value);
  }

  async save(): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: 'Save', exact: true }));
  }

  async expandAdvancedOption(optionName: string): Promise<void> {
    const toggle = this.page.getByRole('button', { name: optionName });
    await this.robustClick(toggle);
  }
}
