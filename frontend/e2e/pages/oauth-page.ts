import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class OAuthPage extends BasePage {
  private readonly oauthSettingsURL = '/k8s/cluster/config.openshift.io~v1~OAuth/cluster';
  private readonly addIDPDropdown = this.page.getByTestId('dropdown-button');
  private readonly idpNameInput = this.page.locator('#idp-name');
  private readonly addIDPButton = this.page.getByTestId('add-idp');
  private readonly errorAlert = this.page.getByTestId('alert-error');

  /**
   * Navigate to OAuth settings page
   */
  async navigateToOAuthSettings(): Promise<void> {
    await this.goTo(this.oauthSettingsURL);
  }

  /**
   * Start IDP setup: open dropdown, select IDP type, enter name
   */
  async startIDPSetup(idpName: string, idpType: string): Promise<void> {
    await this.robustClick(this.addIDPDropdown);
    const idpOption = this.page.getByTestId(idpType);
    await this.robustClick(idpOption);
    await this.idpNameInput.clear();
    await this.idpNameInput.fill(idpName);
  }

  /**
   * Click Add button and verify IDP was created successfully
   */
  async saveAndVerifyIDP(idpName: string, idpType: string): Promise<void> {
    await this.robustClick(this.addIDPButton);

    // Wait for navigation back to OAuth settings page
    await this.waitForLoadingComplete();

    // Verify no error alert
    await expect(this.errorAlert).not.toBeAttached({ timeout: 5_000 });

    // Verify the IDP appears in the list
    const idpNameCell = this.page.getByTestId(`idp-name-${idpName}`);
    await expect(idpNameCell).toBeVisible({ timeout: 30_000 });

    // Verify content matches expected values
    await this.page.waitForFunction(
      ({ name, type }) => {
        const nameEl = document.querySelector(`[data-test="idp-name-${name}"]`);
        const typeEl = document.querySelector(`[data-test="idp-type-${name}"]`);
        return nameEl?.textContent === name && typeEl?.textContent === type;
      },
      { name: idpName, type: idpType },
      { timeout: 10_000 },
    );
  }

  /**
   * Get an IDP row kebab menu
   */
  getIDPKebabMenu(idpName: string): Locator {
    return this.page.getByTestId(`idp-kebab-${idpName}`);
  }

  /**
   * Remove an IDP using the kebab menu
   */
  async removeIDP(idpName: string): Promise<void> {
    // First verify the IDP exists
    const kebabCell = this.getIDPKebabMenu(idpName);
    // eslint-disable-next-line no-restricted-syntax
    await kebabCell.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {
      throw new Error(`IDP "${idpName}" not found in the list - cannot remove`);
    });

    // Open the kebab menu - find the button within the kebab cell
    const kebabButton = kebabCell.getByTestId('kebab-button');
    await this.robustClick(kebabButton);

    // Click the Remove action
    const removeAction = this.page.locator('[data-test-action="Remove identity provider"]');
    await this.robustClick(removeAction);

    // Confirm the removal
    const confirmButton = this.page.getByTestId('confirm-action');
    await this.robustClick(confirmButton);

    // Wait for loading to complete after removal
    await this.waitForLoadingComplete();

    // Verify the IDP was removed (wait up to 30 seconds for OAuth operator to process)
    await expect(kebabCell).not.toBeAttached({ timeout: 30_000 });
  }

  /**
   * Verify an IDP does not exist in the list
   */
  async verifyIDPNotExists(idpName: string): Promise<void> {
    const kebab = this.getIDPKebabMenu(idpName);
    await expect(kebab).not.toBeAttached({ timeout: 5_000 });
  }
}
