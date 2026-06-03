import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class TopologySidebarPage extends BasePage {
  private readonly sidebar: Locator;
  private readonly actionsDropdown: Locator;
  private readonly detailsTab: Locator;
  private readonly resourcesTab: Locator;
  private readonly releaseNotesTab: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebar = this.page.getByTestId('topology-sidepane');
    this.actionsDropdown = this.page.getByTestId('actions-menu-button');
    this.detailsTab = this.page.getByTestId('horizontal-link-Details');
    this.resourcesTab = this.page.getByTestId('horizontal-link-Resources');
    this.releaseNotesTab = this.page.getByTestId('horizontal-link-Release notes');
  }

  async verifySidebarOpen(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }

  async verifyTabs(): Promise<void> {
    await expect(this.detailsTab).toBeVisible();
    await expect(this.resourcesTab).toBeVisible();
    await expect(this.releaseNotesTab).toBeVisible();
  }

  async clickActionsDropdown(): Promise<void> {
    await this.robustClick(this.actionsDropdown);
    // Wait for the dropdown menu to open
    // eslint-disable-next-line no-restricted-syntax
    await this.page.locator('[data-test-id="action-items"]').waitFor({ state: 'visible', timeout: 10_000 });
  }

  async verifyActions(...actions: string[]): Promise<void> {
    const actionItems = this.page.locator('[data-test-id="action-items"] li');

    for (const action of actions) {
      const actionItem = actionItems.filter({ hasText: action });
      await expect(actionItem).toBeVisible({ timeout: 30_000 });
    }
  }

  async selectAction(action: string): Promise<void> {
    const actionLocator = this.page.locator(`[data-test-action="${action}"]`);
    // Wait for the action to be visible in the dropdown menu
    // eslint-disable-next-line no-restricted-syntax
    await actionLocator.waitFor({ state: 'visible', timeout: 30_000 });
    await this.robustClick(actionLocator);
  }

  async selectTab(tabName: string): Promise<void> {
    const tab = this.page.locator(`[data-test="horizontal-link-${tabName}"]`);
    await this.robustClick(tab);
  }

  async selectResource(resource: string, helmRelease: string): Promise<void> {
    const resourceLink = this.page.locator(`[data-test="${helmRelease}-${resource}"]`);
    await this.robustClick(resourceLink);
  }
}
