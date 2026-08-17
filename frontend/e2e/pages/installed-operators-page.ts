import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';
import { Navigation } from './navigation';

export class InstalledOperatorsPage extends BasePage {
  private readonly navigation = new Navigation(this.page);
  private readonly pageHeading = this.page.getByTestId('page-heading');
  private readonly nameFilterInput = this.page.getByTestId('name-filter-input');
  private readonly statusText = this.page.getByTestId('status-text');

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
    return this.page.getByTestId(`operator-row-${operatorName}`);
  }

  /**
  * Get operator status element
  */
  getOperatorStatus(): Locator {
    return this.statusText;
  }

  /**
  * Click on operator row to navigate to details
  */
  async clickOperatorRow(operatorName: string, operatorURLName: string): Promise<void> {
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

    const statusElement = this.page.getByTestId('status-text');
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

    // Select namespace if not openshift-operators
    await this.selectNamespace(namespace);

    await this.filterByName(operatorName);

    // Wait for debounce to complete before clicking (filter-toolbar.tsx uses 250ms debounce)
    await this.page.waitForFunction(() => {
      const input = document.querySelector('[data-test="name-filter-input"]') as HTMLInputElement;
      return input && !input.disabled;
    });

    // Wait for the operator row to be visible
    await expect(this.getOperatorRow(operatorName)).toBeVisible({ timeout: 30_000 });

    // Additional wait to ensure the table row is stable and ready for interaction
    await this.page.waitForFunction(
      (name) => {
        const row = document.querySelector(`[data-test="operator-row-${name}"]`);
        if (!row) return false;
        // Check that row is fully rendered and stable
        const style = window.getComputedStyle(row);
        return style.opacity === '1' && style.visibility === 'visible' && !row.hasAttribute('aria-busy');
      },
      operatorName,
      { timeout: 10_000 }
    );

    await this.clickOperatorRow(operatorName, operatorURLName);

    // Wait for navigation to complete by checking for a page element that only exists on the CSV details page
    // This is more reliable than just waiting for URL or skeleton changes
    await expect(this.page.getByTestId('resource-summary')).toBeVisible({
      timeout: 60_000,
    });

    // Now wait for the Details tab to be visible
    await expect(this.page.getByTestId('horizontal-link-Details')).toBeVisible({ timeout: 30_000 });
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

    // Wait for the page to be ready with either operators or empty state
    try {
      // Try to wait for the name filter input to be available (when operators exist)
      await expect(this.nameFilterInput).toBeVisible({ timeout: 10_000 });
      await this.filterByName(operatorName);
    } catch (error) {
      // If no filter input, check for empty state (no operators in this namespace)
      const emptyState = this.page.getByTestId('console-empty-state');
      await expect(emptyState.or(this.page.locator('[data-test="msg-box-title"]'))).toBeVisible({ timeout: 10_000 });
      console.log(`No operators found in namespace ${namespace} - verification passed`);
      return;
    }

    // Wait for loading to complete after filtering
    await expect(this.page.locator('.loading-skeleton--table')).not.toBeAttached({ timeout: 30_000 });

    await expect(this.getOperatorRow(operatorName)).not.toBeAttached();
  }

  /**
  * Select namespace using project dropdown
  */
  async selectNamespace(namespace: string): Promise<void> {
    const namespaceDropdownButton = this.page.getByTestId('namespace-bar-dropdown').locator('button');
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
    const namespaceOption = this.page.getByTestId('dropdown-menu-item-link').filter({ hasText: new RegExp(`^${namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    await this.robustClick(namespaceOption);

    await expect(this.page.getByTestId('namespace-bar-dropdown')).toHaveText(new RegExp(namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
