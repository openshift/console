import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class InstalledOperatorsPage extends BasePage {
  async navigateTo(namespace?: string): Promise<void> {
    const path = namespace
      ? `/k8s/ns/${namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion`
      : `/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion`;
    await this.goTo(path);
  }

  getOperatorRow(displayName: string): Locator {
    return this.page
      .locator('tr')
      .filter({ has: this.page.getByTestId(`operator-row-${displayName}`) });
  }

  getCompatibleIndicator(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('cluster-compatibility-compatible');
  }

  getIncompatibleIndicator(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('cluster-compatibility-incompatible');
  }

  getSupportPhaseBadge(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('support-phase-badge');
  }

  getSelfSupportBadge(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('support-phase-self-support');
  }
}
