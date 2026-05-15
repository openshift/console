import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export const GLOBAL_INSTALLED_NAMESPACE = 'openshift-operators';

export class InstalledOperatorsPage extends BasePage {
  private readonly nameFilterInput = this.page.getByTestId('name-filter-input');

  constructor(page: Page) {
    super(page);
  }

  async navigateTo(namespace: string = GLOBAL_INSTALLED_NAMESPACE): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion`);
  }

  async filterByName(name: string): Promise<void> {
    await this.nameFilterInput.focus();
    await this.nameFilterInput.clear();
    await this.nameFilterInput.fill(name);
  }

  operatorRow(name: string): Locator {
    return this.page.locator(`[data-test-operator-row="${name}"]`);
  }

  statusText(): Locator {
    return this.page.getByTestId('status-text');
  }

  async waitForOperatorSucceeded(name: string, timeoutMs = 720_000): Promise<void> {
    await expect(this.operatorRow(name)).toBeAttached({ timeout: 300_000 });
    await expect(this.statusText()).toContainText('Succeeded', { timeout: timeoutMs });
  }

  async clickOperatorRow(name: string): Promise<void> {
    await this.robustClick(this.operatorRow(name));
  }

  async navigateToOperatorDetails(
    name: string,
    namespace: string = GLOBAL_INSTALLED_NAMESPACE,
  ): Promise<void> {
    await this.navigateTo(namespace);
    await this.filterByName(name);
    await expect(this.operatorRow(name)).toBeVisible({ timeout: 30_000 });
    await this.robustClick(this.operatorRow(name));
    await expect(this.page).toHaveURL(/ClusterServiceVersion/, { timeout: 30_000 });
    await this.page
      .locator('[data-test-id="horizontal-link-Details"]')
      .waitFor({ state: 'attached', timeout: 30_000 });
  }

  async operatorShouldNotExist(name: string): Promise<void> {
    await expect(this.operatorRow(name)).not.toBeAttached();
  }

  async selectProject(projectName: string): Promise<void> {
    const dropdown = this.page.locator('[data-test-id="namespace-bar-dropdown"] button').first();
    await this.robustClick(dropdown);
    const searchInput = this.page.locator('[data-test="dropdown-text-filter"]');
    await searchInput.fill(projectName);
    const projectOption = this.page.locator(`[id="${projectName}-link"]`);
    await this.robustClick(projectOption);
  }
}
