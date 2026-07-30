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
}
