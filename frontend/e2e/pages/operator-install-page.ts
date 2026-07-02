import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';
import { CatalogPage } from './catalog-page';

export class OperatorInstallPage extends BasePage {
  private readonly catalogPage = new CatalogPage(this.page);
  private readonly installButton = this.page.getByTestId('catalog-details-modal-cta');
  private readonly channelSelect = this.page.getByTestId('operator-channel-select-toggle');
  private readonly versionSelect = this.page.getByTestId('operator-version-select-toggle');
  private readonly allNamespacesRadio = this.page.getByTestId('All namespaces on the cluster-radio-input');
  private readonly specificNamespaceRadio = this.page.getByTestId('A specific namespace on the cluster-radio-input');
  private readonly operatorRecommendedRadio = this.page.getByTestId('Operator recommended Namespace:-radio-input');
  private readonly selectNamespaceRadio = this.page.getByTestId('Select a Namespace-radio-input');
  private readonly namespaceDropdown = this.page.getByTestId('dropdown-selectbox');
  private readonly searchInput = this.page.getByTestId('console-select-search-input').locator('input');
  private readonly installOperatorButton = this.page.getByTestId('install-operator');
  private readonly viewInstalledOperatorsBtn = this.page.getByTestId('view-installed-operators-btn');

  /**
   * Install an operator globally in openshift-operators
   */
  async installOperatorGlobally(operatorName: string, operatorCardTestID: string): Promise<void> {
    await this.goTo('/catalog/all-namespaces');

    await this.catalogPage.clickOperatorTab();
    await this.catalogPage.searchOperators(operatorName);

    // Verify operator exists before clicking
    const operatorCard = this.page.getByTestId(operatorCardTestID);
    await expect(operatorCard).toBeVisible({ timeout: 30_000 });
    await this.robustClick(operatorCard);

    // Wait for install button and verify it has href
    await expect(this.installButton).toBeVisible();
    await expect(this.installButton).toHaveAttribute('href');
    await this.robustClick(this.installButton);

    // Verify installation form elements
    await expect(this.channelSelect).toBeVisible();
    await expect(this.versionSelect).toBeVisible();

    // Verify global installation is selected by default
    await expect(this.allNamespacesRadio).toBeChecked({ timeout: 60_000 });

    // Install the operator
    await this.robustClick(this.installOperatorButton);

    // Verify installation started
    await expect(this.viewInstalledOperatorsBtn).toContainText('View installed Operators in Namespace');
    await this.robustClick(this.viewInstalledOperatorsBtn);
  }

  /**
   * Install operator in specific namespace
   */
  async installOperatorInNamespace(
    operatorName: string,
    operatorCardTestID: string,
    namespace: string,
    useOperatorRecommended: boolean = false,
  ): Promise<void> {
    await this.goTo('/catalog/all-namespaces');

    await this.catalogPage.clickOperatorTab();
    await this.catalogPage.searchOperators(operatorName);

    // Verify operator exists before clicking
    const operatorCard = this.page.getByTestId(operatorCardTestID);
    await expect(operatorCard).toBeVisible({ timeout: 30_000 });
    await this.robustClick(operatorCard);

    // Wait for install button and verify it has href
    await expect(this.installButton).toBeVisible();
    await expect(this.installButton).toHaveAttribute('href');
    await this.robustClick(this.installButton);

    // Configure for specific namespace installation
    await this.specificNamespaceRadio.check({ timeout: 60_000 });

    if (useOperatorRecommended) {
      await this.operatorRecommendedRadio.check();
    } else {
      // Check if select namespace radio exists
      if (await this.selectNamespaceRadio.count() > 0) {
        await this.selectNamespaceRadio.check();
      }

      // Select the namespace
      await this.robustClick(this.namespaceDropdown);
      await this.searchInput.fill(namespace);
      await this.robustClick(this.page.locator(`[data-test-dropdown-menu="${namespace}-Project"]`));
      await expect(this.namespaceDropdown).toContainText(namespace);
    }

    // Install the operator
    await this.robustClick(this.installOperatorButton);

    // Verify installation started and navigate to installed operators
    await expect(this.viewInstalledOperatorsBtn).toContainText('View installed Operators in Namespace');
    await this.robustClick(this.viewInstalledOperatorsBtn);
  }

  /**
   * Install operator in a new namespace created through the UI
   */
  async installOperatorInNewNamespace(
    operatorName: string,
    operatorCardTestID: string,
    namespace: string,
  ): Promise<void> {
    await this.goTo('/catalog/all-namespaces');

    await this.catalogPage.clickOperatorTab();
    await this.catalogPage.searchOperators(operatorName);

    // Verify operator exists before clicking
    const operatorCard = this.page.getByTestId(operatorCardTestID);
    await expect(operatorCard).toBeVisible({ timeout: 30_000 });
    await this.robustClick(operatorCard);

    // Wait for install button and verify it has href
    await expect(this.installButton).toBeVisible();
    await expect(this.installButton).toHaveAttribute('href');
    await this.robustClick(this.installButton);

    // Configure for specific namespace installation
    await this.specificNamespaceRadio.check({ timeout: 60_000 });

    // Check if select namespace radio exists
    if (await this.selectNamespaceRadio.count() > 0) {
      await this.selectNamespaceRadio.check();
    }

    // Create new namespace through UI
    await this.robustClick(this.namespaceDropdown);
    await this.robustClick(this.page.locator('[data-test-dropdown-menu^="Create_"]'));

    // Fill in the namespace name in the modal
    await expect(this.page.getByTestId('input-name')).toBeVisible();
    await this.page.getByTestId('input-name').fill(namespace);
    await this.robustClick(this.page.getByTestId('confirm-action'));

    // Wait for modal to close and namespace to be selected
    await expect(this.page.getByRole('dialog')).toBeHidden();
    await expect(this.namespaceDropdown).toContainText(namespace);

    // Install the operator
    await this.robustClick(this.installOperatorButton);

    // Verify installation started and navigate to installed operators
    await expect(this.viewInstalledOperatorsBtn).toContainText('View installed Operators in Namespace');
    await this.robustClick(this.viewInstalledOperatorsBtn);
  }

  getChannelSelect(): Locator {
    return this.channelSelect;
  }

  getVersionSelect(): Locator {
    return this.versionSelect;
  }

  getInstallButton(): Locator {
    return this.installButton;
  }

  getViewInstalledOperatorsButton(): Locator {
    return this.viewInstalledOperatorsBtn;
  }
}