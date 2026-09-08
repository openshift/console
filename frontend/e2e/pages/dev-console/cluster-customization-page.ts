import type { Locator } from '@playwright/test';

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

  getAvailableSearch(name: 'catalog-types' | 'add-page'): Locator {
    return this.getFormSection(name).getByRole('textbox', { name: 'Available search input' });
  }

  getChosenSearch(name: 'catalog-types' | 'add-page'): Locator {
    return this.getFormSection(name).getByRole('textbox', { name: 'Chosen search input' });
  }

  async moveAvailableToChosen(name: 'catalog-types' | 'add-page', item: string): Promise<void> {
    const section = this.getFormSection(name);
    await section.getByRole('textbox', { name: 'Available search input' }).fill(item);
    await this.robustClick(section.getByRole('option').filter({ hasText: item }).first());
    await this.robustClick(section.getByRole('button', { name: 'Add selected' }));
  }

  async moveChosenToAvailable(name: 'catalog-types' | 'add-page', item: string): Promise<void> {
    const section = this.getFormSection(name);
    await section.getByRole('textbox', { name: 'Chosen search input' }).fill(item);
    await this.robustClick(section.getByRole('option').filter({ hasText: item }).first());
    await this.robustClick(section.getByRole('button', { name: 'Remove selected' }));
  }

  getSuccessAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /success|saved/i });
  }
}
