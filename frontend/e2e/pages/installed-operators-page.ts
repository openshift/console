import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import { escapeRegExp } from '../utils/selector-utils';

import BasePage from './base-page';
import { Navigation } from './navigation';

export class InstalledOperatorsPage extends BasePage {
  private readonly navigation = new Navigation(this.page);
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly nameFilterInput = this.page.getByTestId('name-filter-input');

  /**
  * Navigate to Installed Operators page (legacy method from HEAD)
  */
  async navigateTo(namespace?: string): Promise<void> {
    const path = namespace
      ? `/k8s/ns/${namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion`
      : `/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion`;
    await this.goTo(path);
  }

  /**
  * Navigate to Installed Operators page
  */
  async navigateToInstalledOperators(): Promise<void> {
    await this.navigation.clickNavLink('Ecosystem', 'Installed Operators');
    await expect(this.pageHeading).toContainText('Installed Operators');
  }

  /**
  * Filter operators by name
  */
  async filterByName(operatorName: string): Promise<void> {
    await this.nameFilterInput.focus();
    await this.nameFilterInput.clear();
    await this.nameFilterInput.fill(operatorName);
  }

  /**
  * Get operator row by name
  */
  getOperatorRow(operatorName: string): Locator {
    return this.page.locator('tr').filter({ has: this.page.getByTestId(`operator-row-${operatorName}`) });
  }

  /**
  * Get operator status element
  */
  getOperatorStatus(operatorName: string): Locator {
    return this.getOperatorRow(operatorName).getByTestId('status-text');
  }

  /**
  * Click on operator row to navigate to details
  */
  async clickOperatorRow(operatorName: string): Promise<void> {
    // Get h1 child of the operator row (clicking the <a> directly is flaky, hitting the <h1> works)
    const operatorLink = this.getOperatorRow(operatorName).locator('h1');

    await expect(operatorLink).toBeVisible({ timeout: 30_000 });
    await this.robustClick(operatorLink);
  }

  /**
  * Verify operator installation succeeded
  */
  async verifyOperatorInstallationSucceeded(operatorName: string): Promise<void> {
    await this.navigateToInstalledOperators();
    await this.filterByName(operatorName);

    const operatorRow = this.getOperatorRow(operatorName);
    await expect(operatorRow).toBeVisible({ timeout: 60_000 });

    const statusElement = this.getOperatorStatus(operatorName);
    await expect(async () => {
      const currentText = await statusElement.textContent({ timeout: 5_000 });
      expect(currentText ?? '').not.toContain('Failed');
      expect(currentText ?? '').toContain('Succeeded');
    }).toPass({ intervals: [5_000], timeout: 180_000 });
  }

  /**
  * Navigate to operator details page
  */
  async navigateToOperatorDetails(operatorName: string, operatorURLName: string, namespace: string = 'openshift-operators'): Promise<void> {
    await this.navigateToInstalledOperators();

    // Select namespace before filtering for the operator row.
    await this.selectNamespace(namespace);

    await this.filterByName(operatorName);

    // Wait for the operator row to be visible
    await expect(this.getOperatorRow(operatorName)).toBeVisible({ timeout: 30_000 });

    // Navigate via href to bypass unreliable h1-click-inside-logo-link PF v6 behavior.
    const href = await this.page.getByTestId(`operator-row-${operatorName}`).getAttribute('href');
    await this.goTo(href ?? `/k8s/ns/${namespace}/operators.coreos.com~v1~ClusterServiceVersion/${operatorURLName}`);

    await expect(this.page.getByTestId('resource-summary')).toBeVisible({ timeout: 60_000 });
    await expect(this.page.getByTestId('horizontal-link-Details')).toBeVisible({ timeout: 60_000 });
  }

  /**
  * Verify operator no longer exists
  */
  async verifyOperatorNotExists(operatorName: string): Promise<void> {
    await this.navigateToInstalledOperators();

    // Wait for loading to complete
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    await this.filterByName(operatorName);
    await expect(this.getOperatorRow(operatorName)).not.toBeAttached();
  }

  /**
  * Verify no operators exist in the current namespace (empty state)
  */
  async verifyNoOperatorsInstalled(): Promise<void> {
    await this.navigateToInstalledOperators();

    // Wait for loading to complete
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    // Verify empty state appears
    const emptyState = this.page.getByTestId('console-empty-state');
    await expect(emptyState).toContainText('No Operators found');
  }

  /**
  * Verify operator is not installed in specific namespace (for isolation testing)
  */
  async verifyOperatorNotInstalledInNamespace(operatorName: string, namespace: string): Promise<void> {
    await this.navigateToInstalledOperators();
    await this.selectNamespace(namespace);

    // Wait for loading to complete
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    // Wait for the page to be ready with either operators or the expected empty state.
    const emptyState = this.page.getByTestId('console-empty-state');
    await expect(this.nameFilterInput.or(emptyState).first()).toBeVisible({ timeout: 10_000 });

    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('No Operators found', { timeout: 10_000 });
      return;
    }

    await this.filterByName(operatorName);

    // Wait for loading to complete after filtering
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    await expect(this.getOperatorRow(operatorName)).not.toBeAttached();
  }

  /**
  * Select namespace using project dropdown
  */
  async selectNamespace(namespace: string): Promise<void> {
    const namespaceDropdownButton = this.page.getByTestId('namespace-bar-dropdown').getByRole('button').first();
    await this.robustClick(namespaceDropdownButton);

    // Check if showSystemSwitch is checked, if not, check it
    const showSystemSwitch = this.page.getByTestId('showSystemSwitch');
    const isChecked = await showSystemSwitch.isChecked();
    if (!isChecked) {
      await showSystemSwitch.click();
    }

    // Filter the namespace list to make the target namespace visible
    const textFilter = this.page.getByTestId('dropdown-text-filter');
    await textFilter.fill(namespace);

    // Select the dropdown menu item that exactly matches our namespace text
    const escapedNamespace = escapeRegExp(namespace);
    const namespaceOption = this.page
      .getByTestId('dropdown-menu-item-link')
      .filter({ hasText: new RegExp(`^${escapedNamespace}$`) });
    await this.robustClick(namespaceOption);

    const normalizedNamespace = escapedNamespace.replace(/\s+/g, '\\s+');
    await expect(namespaceDropdownButton).toHaveText(
      new RegExp(`^(?:Project|Namespace):\\s*${normalizedNamespace}\\s*$`),
      { timeout: 30_000 },
    );
  }

  getPageHeading(): Locator {
    return this.pageHeading;
  }

  getNameFilterInput(): Locator {
    return this.nameFilterInput;
  }

  /**
  * Get compatible indicator (from HEAD version)
  */
  getCompatibleIndicator(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('cluster-compatibility-compatible');
  }

  /**
  * Get incompatible indicator (from HEAD version)
  */
  getIncompatibleIndicator(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('cluster-compatibility-incompatible');
  }

  /**
  * Get support phase badge (from HEAD version)
  */
  getSupportPhaseBadge(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('support-phase-badge');
  }

  /**
  * Get self support badge (from HEAD version)
  */
  getSelfSupportBadge(displayName: string): Locator {
    return this.getOperatorRow(displayName).getByTestId('support-phase-self-support');
  }
}
