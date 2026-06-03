import { expect, type Locator, type Page } from '@playwright/test';
import BasePage from './base-page';

export class TopologyPage extends BasePage {
  private readonly topologyView: Locator;
  private readonly emptyState: Locator;
  private readonly topology: Locator;
  private readonly searchInput: Locator;
  private readonly graphViewSwitcher: Locator;
  private readonly resetView: Locator;
  private readonly fitToScreen: Locator;
  private readonly highlightedNode: Locator;

  constructor(page: Page) {
    super(page);
    this.topologyView = this.page.locator('[data-test-id="topology"]');
    this.emptyState = this.page.locator('[data-test="topology-empty-state"]');
    this.topology = this.page.locator('[data-id="odc-topology-graph"]');
    this.searchInput = this.page.locator('[data-test-id="item-filter"]');
    this.graphViewSwitcher = this.page.locator(
      '[data-test-id="topology-switcher-view"][aria-label="Graph view"]',
    );
    this.resetView = this.page.locator('#reset-view');
    this.fitToScreen = this.page.locator('#fit-to-screen');
    this.highlightedNode = this.page.locator('.is-filtered').first();
  }

  async navigateToTopology(namespace?: string): Promise<void> {
    const url = namespace ? `/topology/ns/${namespace}` : '/topology';
    await this.goTo(url);
    await this.waitForLoadingComplete(10_000);
  }

  async verifyTopologyPage(): Promise<void> {
    await expect(this.topologyView.or(this.emptyState)).toBeVisible({ timeout: 30_000 });
  }

  /** Migrated from topologyHelper.verifyWorkloadInTopologyPage (Cypress). */
  private async verifyTopologyPageNotEmpty(timeout = 60_000): Promise<void> {
    await expect(this.topology).toBeVisible({ timeout });
    await expect(this.topology.getByTestId('no-resources-found')).not.toBeAttached();
  }

  private async searchTopology(name: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(name);
  }

  private async ensureGraphView(): Promise<void> {
    if ((await this.graphViewSwitcher.count()) > 0) {
      await this.robustClick(this.graphViewSwitcher);
    }
  }

  async verifyWorkloadInTopologyPage(
    workloadName: string,
    options?: { timeout?: number },
  ): Promise<void> {
    const timeout = options?.timeout ?? 60_000;
    await this.verifyTopologyPageNotEmpty(timeout);
    await this.searchTopology(workloadName);
    await this.ensureGraphView();
    await this.robustClick(this.resetView);
    await this.robustClick(this.fitToScreen);
    await expect(this.highlightedNode).toBeVisible({ timeout });
    await this.waitForLoadingComplete();
  }

  async clickWorkload(workloadName: string): Promise<void> {
    await this.waitForLoadingComplete();
    const workloadNode = this.page.locator('.odc-base-node__label', { hasText: workloadName });
    await workloadNode.scrollIntoViewIfNeeded();
    await this.robustClick(workloadNode);
  }

  async rightClickWorkload(workloadName: string): Promise<void> {
    await this.waitForLoadingComplete();
    await this.searchTopology(workloadName);
    await this.ensureGraphView();
    await this.robustClick(this.resetView);
    await this.robustClick(this.fitToScreen);
    const workloadNode = this.page.locator('.is-filtered').nth(1).locator('.pf-topology__node__action-icon__icon > .pf-v6-svg > .pf-v6-icon-rh-ui').first();
    await workloadNode.scrollIntoViewIfNeeded();
    await this.robustClick(workloadNode);
  }

  async verifyContextMenu(): Promise<void> {
    const contextMenu = this.page.locator('.odc-topology-context-menu');
    await expect(contextMenu).toBeVisible();
  }

  async verifyContextMenuActions(actions: string[]): Promise<void> {
    for (const action of actions) {
      const actionLocator = this.page.locator(`[data-test-action="${action}"]`);
      await expect(actionLocator).toBeVisible();
    }
  }

  async selectContextMenuAction(action: string): Promise<void> {
    const actionLocator = this.page.locator(`[data-test-action="${action}"]`);
    await this.robustClick(actionLocator);
  }

  async clickOnGroup(groupName: string): Promise<void> {
    const group = this.page
      .locator('[data-type="group"]')
      .filter({ hasText: groupName });
    await this.robustClick(group);
  }
}
