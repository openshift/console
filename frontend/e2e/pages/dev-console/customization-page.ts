import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from '../base-page';

export class CustomizationPage extends BasePage {
  private readonly successAlert = this.page.locator('[aria-label="Success Alert"]');
  private readonly clusterLink = this.page.getByTestId('cluster');
  private readonly customizeAction = this.page.locator('[data-test-action="Customize"]');
  private readonly actionsMenuButton = this.page.locator('[data-test-id="actions-menu-button"]');

  constructor(page: Page) {
    super(page);
  }

  async navigateToConsoles(): Promise<void> {
    await this.goTo('/search?kind=console.operator.openshift.io~v1~Console');
    await this.waitForLoadingComplete();
  }

  async clickCluster(): Promise<void> {
    await this.robustClick(this.clusterLink);
  }

  async openCustomization(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.customizeAction);
    await this.waitForLoadingComplete();
  }

  async clickDeveloperTab(): Promise<void> {
    const tab = this.page.locator('[role="presentation"]').filter({ hasText: 'Developer' });
    await this.robustClick(tab);
  }

  async disableAllSoftwareCatalogItems(): Promise<void> {
    const formSection = this.page.getByTestId('catalog-types form-section');
    const removeAll = formSection.locator('[aria-label="Remove all"]');
    await removeAll.scrollIntoViewIfNeeded();
    if (await removeAll.isEnabled()) {
      await removeAll.click();
    }
    const addAll = formSection.locator('[aria-label="Add all"]');
    await addAll.scrollIntoViewIfNeeded();
    await addAll.click();
  }

  async disableSoftwareCatalogItem(itemName: string): Promise<void> {
    const formSection = this.page.getByTestId('catalog-types form-section');
    await formSection.locator('[aria-label="Remove all"]').click();
    await formSection.locator('[aria-label="Available search input"]').fill(itemName);
    const option = formSection.locator('[role="option"]').filter({ hasText: itemName });
    await option.scrollIntoViewIfNeeded();
    await option.click();
    await formSection.locator('[aria-label="Add selected"]').scrollIntoViewIfNeeded();
    await formSection.locator('[aria-label="Add selected"]').click();
  }

  async enableOnlySoftwareCatalogItem(itemName: string): Promise<void> {
    const formSection = this.page.getByTestId('catalog-types form-section');
    await formSection.locator('[aria-label="Add all"]').click();
    await formSection.locator('[aria-label="Chosen search input"]').fill(itemName);
    const option = formSection.locator('[role="option"]').filter({ hasText: itemName });
    await option.click();
    await formSection.locator('[aria-label="Remove selected"]').click();
  }

  async disableAllAddPageItems(): Promise<void> {
    const formSection = this.page.getByTestId('add-page form-section');
    await formSection.locator('[aria-label="Add all"]').scrollIntoViewIfNeeded();
    await formSection.locator('[aria-label="Add all"]').click();
  }

  async disableAddPageItem(itemName: string): Promise<void> {
    const formSection = this.page.getByTestId('add-page form-section');
    await formSection.locator('[aria-label="Remove all"]').click();
    await formSection.locator('[aria-label="Available search input"]').fill(itemName);
    const option = formSection.locator('[role="option"]').filter({ hasText: itemName });
    await option.scrollIntoViewIfNeeded();
    await option.click();
    await formSection.locator('[aria-label="Add selected"]').scrollIntoViewIfNeeded();
    await formSection.locator('[aria-label="Add selected"]').click();
  }

  async expectSaveMessage(): Promise<void> {
    await this.successAlert.scrollIntoViewIfNeeded();
    await expect(this.successAlert).toBeVisible();
  }

  async expectPinnedResourceSection(): Promise<void> {
    await expect(this.page.getByTestId('pinned-resource form-section')).toBeVisible();
  }

  async expectPerspectiveDropdownValue(value: string): Promise<void> {
    const perspectiveGroup = this.page.locator('[data-test="perspectives form-group"]').nth(1);
    await expect(perspectiveGroup.locator('button[class*="menu-toggle"]')).toContainText(value);
  }

  async selectPerspectiveState(state: string): Promise<void> {
    const perspectiveGroup = this.page.locator('[data-test="perspectives form-group"]').nth(1);
    const toggle = perspectiveGroup
      .locator('button')
      .filter({ hasText: /Disabled|Enabled|AccessReview/ });
    await this.robustClick(toggle);
    await expect(this.page.locator('[role="listbox"]')).toBeVisible();
    const option = this.page.locator('button[role="option"]').filter({ hasText: state });
    await this.robustClick(option);
  }

  async expectSuccessAlert(): Promise<void> {
    await expect(this.page.getByTestId('success-alert')).toBeVisible();
  }
}
