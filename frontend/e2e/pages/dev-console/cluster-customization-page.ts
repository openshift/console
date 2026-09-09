import type { Locator } from '@playwright/test';

import { expect } from '../../fixtures';
import BasePage from '../base-page';

export class ClusterCustomizationPage extends BasePage {
  async navigateToCustomize(): Promise<void> {
    await this.goTo('/k8s/cluster/operator.openshift.io~v1~Console/cluster');
    await this.robustClick(this.page.getByTestId('Customize'));
  }

  getHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Cluster configuration' });
  }

  getPerspectivesSection(): Locator {
    return this.page.getByTestId('perspectives form-section');
  }

  getPerspectiveSectionItem(name: string): Locator {
    return this.getPerspectivesSection().getByText(name);
  }

  getTab(name: string): Locator {
    return this.page.getByRole('tab', { name });
  }

  getPrePinnedSection(): Locator {
    return this.page.getByText('Pre-pinned navigation items');
  }

  getAvailableResources(): Locator {
    return this.page.getByText('Available Resources');
  }

  getPinnedResources(): Locator {
    return this.page.getByText('Pinned Resources', { exact: true });
  }

  getFormSection(name: 'catalog-types' | 'add-page'): Locator {
    return this.page.getByTestId(`${name} form-section`);
  }

  private async ensureFormSection(name: 'catalog-types' | 'add-page'): Promise<Locator> {
    const section = this.getFormSection(name);
    if (!(await section.isVisible().catch(() => false))) {
      await this.robustClick(this.page.getByRole('tab', { name: 'Developer' }));
    }
    await expect(section).toBeVisible({ timeout: 30_000 });
    return section;
  }

  async waitForItemInList(
    name: 'catalog-types' | 'add-page',
    item: string,
    list: 'available' | 'chosen',
  ): Promise<void> {
    const section = await this.ensureFormSection(name);
    const searchName = list === 'available' ? 'Available search input' : 'Chosen search input';
    const search = section.getByRole('textbox', { name: searchName });
    await search.fill(item);
    const pane = search.locator(
      'xpath=ancestor::div[contains(@class, "dual-list-selector__pane")][1]',
    );
    await expect(pane.getByRole('option').filter({ hasText: item }).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  async hasItemInList(
    name: 'catalog-types' | 'add-page',
    item: string,
    list: 'available' | 'chosen',
  ): Promise<boolean> {
    await this.navigateToCustomize();
    const section = await this.ensureFormSection(name);
    const searchName = list === 'available' ? 'Available search input' : 'Chosen search input';
    const search = section.getByRole('textbox', { name: searchName });
    await search.fill(item);
    const pane = search.locator(
      'xpath=ancestor::div[contains(@class, "dual-list-selector__pane")][1]',
    );
    return (await pane.getByRole('option').filter({ hasText: item }).count()) > 0;
  }

  getAvailableSearch(name: 'catalog-types' | 'add-page'): Locator {
    return this.getFormSection(name).getByRole('textbox', { name: 'Available search input' });
  }

  getChosenSearch(name: 'catalog-types' | 'add-page'): Locator {
    return this.getFormSection(name).getByRole('textbox', { name: 'Chosen search input' });
  }

  async moveAvailableToChosen(name: 'catalog-types' | 'add-page', item: string): Promise<void> {
    const section = await this.ensureFormSection(name);
    const search = section.getByRole('textbox', { name: 'Available search input' });
    await search.fill(item);
    const option = section.getByRole('option').filter({ hasText: item }).first();
    const addButton = section.getByRole('button', { name: 'Add selected' });
    await this.robustClick(option);
    await expect(addButton).toBeEnabled({ timeout: 10_000 });
    await this.robustClick(addButton);
  }

  async moveChosenToAvailable(name: 'catalog-types' | 'add-page', item: string): Promise<void> {
    const section = await this.ensureFormSection(name);
    const search = section.getByRole('textbox', { name: 'Chosen search input' });
    await search.fill(item);
    const option = section.getByRole('option').filter({ hasText: item }).first();
    const removeButton = section.getByRole('button', { name: 'Remove selected' });
    await this.robustClick(option);
    await expect(removeButton).toBeEnabled({ timeout: 10_000 });
    await this.robustClick(removeButton);
  }

  getSuccessAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /success|saved/i });
  }
}
