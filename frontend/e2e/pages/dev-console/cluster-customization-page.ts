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

  private getSelector(name: 'catalog-types' | 'add-page'): Locator {
    return this.page.getByTestId(`${name}-selector`);
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
    await this.ensureFormSection(name);
    const searchName = list === 'available' ? 'Available search input' : 'Chosen search input';
    const selector = this.getSelector(name);
    const search = selector.getByRole('textbox', { name: searchName });
    await search.fill(item);
    await expect(selector.getByRole('option').filter({ hasText: item }).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  async hasItemInList(
    name: 'catalog-types' | 'add-page',
    item: string,
    list: 'available' | 'chosen',
  ): Promise<boolean> {
    await this.navigateToCustomize();
    await this.ensureFormSection(name);
    const searchName = list === 'available' ? 'Available search input' : 'Chosen search input';
    const selector = this.getSelector(name);
    const search = selector.getByRole('textbox', { name: searchName });
    await search.fill(item);
    return (await selector.getByRole('option').filter({ hasText: item }).count()) > 0;
  }

  async moveAvailableToChosen(name: 'catalog-types' | 'add-page', item: string): Promise<void> {
    await this.ensureFormSection(name);
    const selector = this.getSelector(name);
    const search = selector.getByRole('textbox', { name: 'Available search input' });
    await search.fill(item);
    const option = selector.getByRole('option').filter({ hasText: item }).first();
    const addButton = selector.getByRole('button', { name: 'Add selected' });
    await this.robustClick(option);
    await expect(addButton).toBeEnabled({ timeout: 10_000 });
    await this.robustClick(addButton);
  }

  async moveChosenToAvailable(name: 'catalog-types' | 'add-page', item: string): Promise<void> {
    await this.ensureFormSection(name);
    const selector = this.getSelector(name);
    const search = selector.getByRole('textbox', { name: 'Chosen search input' });
    await search.fill(item);
    const option = selector.getByRole('option').filter({ hasText: item }).first();
    const removeButton = selector.getByRole('button', { name: 'Remove selected' });
    await this.robustClick(option);
    await expect(removeButton).toBeEnabled({ timeout: 10_000 });
    await this.robustClick(removeButton);
  }
}
