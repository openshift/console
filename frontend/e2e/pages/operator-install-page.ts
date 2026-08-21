import type { Locator } from '@playwright/test';

import { expect } from '../fixtures';
import { escapeRegExp } from '../utils/selector-utils';

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
  private readonly createNamespaceOption = this.page.getByRole('option', {
    name: /^Create (Project|Namespace)$/,
  });
  private readonly namespaceNameInput = this.page.getByTestId('input-name');
  private readonly confirmAction = this.page.getByTestId('confirm-action');
  private readonly detailsModal = this.page.getByRole('dialog');

  private async openInstallForm(operatorName: string, operatorCardTestID: string): Promise<void> {
    // Navigate first so the perspective toggle exists, then switch — Developer perspective shows a project selector not tiles.
    await this.goTo('/catalog/all-namespaces?catalogType=operator');
    await this.switchPerspective('Administrator');
    await this.goTo('/catalog/all-namespaces?catalogType=operator');
    await expect(this.catalogPage.getPageHeading()).toBeVisible({ timeout: 60_000 });
    await this.catalogPage.searchOperators(operatorName);

    const operatorCard = this.page
      .getByTestId(operatorCardTestID)
      .filter({ hasNotText: 'testing deprecation' });
    await this.robustClick(operatorCard, { timeout: 30_000 });

    await expect(this.installButton).toHaveAttribute('href');
    await this.robustClick(this.installButton);
  }

  /**
   * Install an operator globally in openshift-operators
   */
  async installOperatorGlobally(operatorName: string, operatorCardTestID: string): Promise<void> {
    await this.openInstallForm(operatorName, operatorCardTestID);

    // Verify installation form elements
    await expect(this.channelSelect).toBeVisible();
    await expect(this.versionSelect).toBeVisible();

    // Verify global installation is selected by default
    await expect(this.allNamespacesRadio).toBeChecked({ timeout: 30_000 });

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
    await this.openInstallForm(operatorName, operatorCardTestID);

    // Configure for specific namespace installation
    await this.specificNamespaceRadio.check({ timeout: 30_000 });

    if (useOperatorRecommended) {
      await this.operatorRecommendedRadio.check();
    } else {
      // Check if select namespace radio exists with timeout
      try {
        await expect(this.selectNamespaceRadio).toBeVisible({ timeout: 5_000 });
        await this.selectNamespaceRadio.check();
      } catch {
        // Element not available within timeout, continue without checking it
      }

      // Select the namespace
      await this.robustClick(this.namespaceDropdown);
      await this.searchInput.fill(namespace);
      const escapedNamespace = escapeRegExp(namespace);
      const namespaceOption = this.page
        .getByTestId('dropdown-menu-item-link')
        .filter({ hasText: new RegExp(`^${escapedNamespace}$`) })
        .first();
      await this.robustClick(namespaceOption);
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
    await this.openInstallForm(operatorName, operatorCardTestID);

    // Configure for specific namespace installation
    await this.specificNamespaceRadio.check({ timeout: 30_000 });

    // Check if select namespace radio exists with timeout
    try {
      await expect(this.selectNamespaceRadio).toBeVisible({ timeout: 5_000 });
      await this.selectNamespaceRadio.check();
    } catch {
      // Element not available within timeout, continue without checking it
    }

    await this.createNamespaceFromDropdown(namespace);

    // Install the operator
    await this.robustClick(this.installOperatorButton);

    // Verify installation started and navigate to installed operators
    await expect(this.viewInstalledOperatorsBtn).toContainText('View installed Operators in Namespace');
    await this.robustClick(this.viewInstalledOperatorsBtn);
  }

  async clickDetailsModalInstall(): Promise<void> {
    await expect(this.detailsModal).toBeVisible();
    await this.robustClick(this.detailsModal.getByRole('button', { name: 'Install' }));
  }

  async selectSpecificNamespaceMode(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Install Operator' })).toBeVisible();
    await this.specificNamespaceRadio.check({ timeout: 30_000 });
  }

  async createNamespaceFromDropdown(namespace: string): Promise<void> {
    await this.robustClick(this.namespaceDropdown);
    await this.robustClick(this.createNamespaceOption);
    await this.namespaceNameInput.fill(namespace);
    await this.robustClick(this.confirmAction);
    await expect(this.detailsModal).toBeHidden();
    await expect(this.namespaceDropdown).toContainText(namespace);
  }

  async clickInstallOperator(): Promise<void> {
    await this.robustClick(this.installOperatorButton);
  }

  getNamespaceDropdown(): Locator {
    return this.namespaceDropdown;
  }

  getDeprecatedWarningIcon(kind: 'channel' | 'version'): Locator {
    return this.page.getByTestId(`deprecated-operator-warning-${kind}-icon`);
  }

  getChannelOption(channel: string): Locator {
    return this.page.getByTestId(`channel-option-${channel}`);
  }

  getVersionOption(version: string): Locator {
    return this.page.getByTestId(`version-option-${version}`);
  }

  getChannelSelect(): Locator {
    return this.channelSelect;
  }

  getVersionSelect(): Locator {
    return this.versionSelect;
  }

  async openChannelSelect(): Promise<void> {
    await this.robustClick(this.channelSelect);
  }

  async openVersionSelect(): Promise<void> {
    await this.robustClick(this.versionSelect);
  }

  async selectChannelOption(channel: string): Promise<void> {
    await this.robustClick(this.getChannelOption(channel));
  }

  async selectVersionOption(version: string): Promise<void> {
    await this.robustClick(this.getVersionOption(version));
  }

  getInstallButton(): Locator {
    return this.installButton;
  }

  getViewInstalledOperatorsButton(): Locator {
    return this.viewInstalledOperatorsBtn;
  }
}