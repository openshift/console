import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class OperatorHubPage extends BasePage {
  private readonly operatorTab = this.page.getByTestId('tab operator');
  private readonly searchCatalog = this.page.getByTestId('search-catalog').locator('input');
  private readonly installCta = this.page.getByTestId('catalog-details-modal-cta');
  private readonly channelSelectToggle = this.page.getByTestId('operator-channel-select-toggle');
  private readonly versionSelectToggle = this.page.getByTestId('operator-version-select-toggle');
  private readonly allNamespacesRadio = this.page.getByTestId(
    'All namespaces on the cluster-radio-input',
  );
  private readonly specificNamespaceRadio = this.page.getByTestId(
    'A specific namespace on the cluster-radio-input',
  );
  private readonly namespaceDropdown = this.page.getByTestId('dropdown-selectbox');
  private readonly namespaceSearchInput = this.page
    .getByTestId('console-select-search-input')
    .locator('input');
  private readonly installOperatorButton = this.page.getByTestId('install-operator');
  private readonly viewInstalledButton = this.page.getByTestId('view-installed-operators-btn');

  constructor(page: Page) {
    super(page);
  }

  async navigateToCatalog(namespace: string): Promise<void> {
    await this.goTo(`/catalog/ns/${namespace}`);
  }

  async searchOperator(name: string): Promise<void> {
    await this.robustClick(this.operatorTab);
    await this.searchCatalog.fill(name);
  }

  async clickOperatorTile(testID: string): Promise<void> {
    await this.robustClick(this.page.getByTestId(testID));
  }

  async clickInstallButton(): Promise<void> {
    await expect(this.installCta).toBeVisible();
    await expect(this.installCta).toHaveAttribute('href');
    await this.robustClick(this.installCta);
  }

  async verifyInstallFormLoaded(): Promise<void> {
    await expect(this.channelSelectToggle).toBeAttached();
    await expect(this.versionSelectToggle).toBeAttached();
  }

  async selectInstallMode(
    mode: 'global' | 'namespace',
    namespace?: string,
    useRecommended = false,
  ): Promise<void> {
    if (mode === 'namespace') {
      await this.specificNamespaceRadio.waitFor({ state: 'visible' });
      await this.specificNamespaceRadio.check();
      if (useRecommended) {
        await this.page.getByTestId('Operator recommended Namespace:-radio-input').check();
      } else {
        const selectNsRadio = this.page.getByTestId('Select a Namespace-radio-input');
        if ((await selectNsRadio.count()) > 0) {
          await selectNsRadio.check();
        }
        if (namespace) {
          await this.robustClick(this.namespaceDropdown);
          await this.namespaceSearchInput.fill(namespace);
          await this.robustClick(
            this.page.locator(`[data-test-dropdown-menu="${namespace}-Project"]`),
          );
          await expect(this.namespaceDropdown).toContainText(namespace);
        }
      }
    } else {
      await expect(this.allNamespacesRadio).toBeChecked();
    }
  }

  async submitInstall(): Promise<void> {
    await this.robustClick(this.installOperatorButton);
  }

  async verifyInstallationStarted(): Promise<void> {
    await expect(this.viewInstalledButton).toContainText('View installed Operators in Namespace');
  }

  async clickViewInstalledOperators(): Promise<void> {
    await this.robustClick(this.viewInstalledButton);
  }

  async installOperator(
    operatorName: string,
    operatorCardTestID: string,
    namespace: string,
    installToNamespace = 'openshift-operators',
    useRecommended = false,
  ): Promise<void> {
    await this.navigateToCatalog(namespace);
    await this.searchOperator(operatorName);
    await this.clickOperatorTile(operatorCardTestID);
    await this.clickInstallButton();
    await this.verifyInstallFormLoaded();
    const mode = installToNamespace === 'openshift-operators' ? 'global' : 'namespace';
    await this.selectInstallMode(mode, installToNamespace, useRecommended);
    await this.submitInstall();
    await this.verifyInstallationStarted();
    await this.clickViewInstalledOperators();
  }

  async openCreateNamespaceModal(): Promise<void> {
    await this.robustClick(this.namespaceDropdown);
    const createOption = this.page.locator('[data-test-dropdown-menu^="Create_"]');
    await this.robustClick(createOption);
  }

  catalogTile(testID: string): Locator {
    return this.page.getByTestId(testID);
  }

  deprecatedBadge(): Locator {
    return this.page.getByTestId('deprecated-operator-badge');
  }

  deprecationWarning(type: 'package' | 'channel' | 'version'): Locator {
    return this.page.getByTestId(`deprecated-${type}-warning`);
  }

  channelOption(channel: string): Locator {
    return this.page.locator(`[data-test="operator-channel-${channel}"]`);
  }

  versionOption(version: string): Locator {
    return this.page.locator(`[data-test="operator-version-${version}"]`);
  }
}
