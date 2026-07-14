import type { Locator } from '@playwright/test';
import { expect } from '../../fixtures';

import BasePage from '../base-page';

export class TopologyKnativePage extends BasePage {
  private readonly graphView = this.page.getByTestId('topology-switcher-view');
  private readonly fitToScreen = this.page.locator('#fit-to-screen');
  private readonly resetView = this.page.locator('#reset-view');
  private readonly searchInput = this.page.getByTestId('item-filter');
  private readonly highlightedNode = this.page.locator('.is-filtered').first();
  private readonly knativeServiceNode = this.page.locator('[data-type="knative-service"]');
  private readonly sidePane = this.page.getByTestId('topology-sidepane');
  private readonly sidePaneClose = this.page.getByTestId('topology-sidepane').locator('button[aria-label="Close"]');
  private readonly editAnnotationsLink = this.page.getByTestId('edit-annotations');
  private readonly modalTitle = this.page.getByTestId('modal-title');
  private readonly modalCancel = this.page.getByTestId('modal-cancel-action');

  async navigateToTopology(namespace: string): Promise<void> {
    await this.goTo(`/topology/ns/${namespace}?view=graph`);
    await this.waitForLoadingComplete();
  }

  async switchToGraphView(): Promise<void> {
    const graphViewToggle = this.graphView.and(this.page.locator('[aria-label="Graph view"]'));
    const switcherCount = await graphViewToggle.count();
    if (switcherCount > 0) {
      await this.robustClick(graphViewToggle);
    }
  }

  async fitScreen(): Promise<void> {
    await this.robustClick(this.fitToScreen);
  }

  async resetViewport(): Promise<void> {
    await this.robustClick(this.resetView);
  }

  async search(name: string): Promise<void> {
    await this.searchInput.fill(name);
  }

  async verifyWorkloadVisible(name: string): Promise<void> {
    await this.search(name);
    await expect(this.highlightedNode).toBeVisible({ timeout: 60_000 });
  }

  async rightClickOnKnativeService(serviceName: string): Promise<void> {
    const serviceLabel = this.knativeServiceNode
      .locator('.odc-knative-service__label')
      .filter({ hasText: serviceName })
      .first();
    await expect(async () => {
      await this.page.reload({ waitUntil: 'load' });
      await this.waitForLoadingComplete();
      await this.switchToGraphView();
      await this.fitScreen();
      await expect(serviceLabel).toBeVisible();
    }).toPass({ timeout: 120_000, intervals: [10_000] });
    // eslint-disable-next-line playwright/no-force-option
    await serviceLabel.click({ button: 'right', force: true, timeout: 30_000 });
  }

  async rightClickOnKnativeRevision(serviceName: string): Promise<void> {
    const revisionNode = this.page
      .locator('[data-type="knative-revision"]')
      .filter({ hasText: serviceName })
      .first();
    await expect(async () => {
      await this.page.reload({ waitUntil: 'load' });
      await this.waitForLoadingComplete();
      await this.switchToGraphView();
      await this.fitScreen();
      await expect(revisionNode).toBeVisible();
    }).toPass({ timeout: 120_000, intervals: [10_000] });
    // eslint-disable-next-line playwright/no-force-option
    await revisionNode.click({ button: 'right', force: true, timeout: 30_000 });
  }

  async selectContextMenuAction(action: string): Promise<void> {
    const menuItem = this.page.locator(
      `[data-test="${action}"], [data-test-action="${action}"]`,
    );
    await this.robustClick(menuItem.first(), { timeout: 10_000 });
  }

  async rightClickAndSelectAction(serviceName: string, action: string): Promise<void> {
    await this.rightClickOnKnativeService(serviceName);
    await this.selectContextMenuAction(action);
  }

  async rightClickRevisionAndSelectAction(serviceName: string, action: string): Promise<void> {
    await this.rightClickOnKnativeRevision(serviceName);
    await this.selectContextMenuAction(action);
  }

  async clickOnKnativeService(serviceName: string): Promise<void> {
    const serviceLabel = this.knativeServiceNode
      .locator('.odc-base-node__label')
      .filter({ hasText: serviceName });
    await expect(async () => {
      await this.page.reload({ waitUntil: 'load' });
      await this.waitForLoadingComplete();
      await this.switchToGraphView();
      await this.fitScreen();
      await expect(serviceLabel).toBeVisible();
    }).toPass({ timeout: 120_000, intervals: [10_000] });
    // eslint-disable-next-line playwright/no-force-option
    await serviceLabel.click({ force: true, timeout: 30_000 });
  }

  async clickOnApplicationGrouping(appName: string): Promise<void> {
    const appNode = this.page.locator(`[data-id="group:${appName}"]`).first();
    // eslint-disable-next-line playwright/no-force-option
    await appNode.click({ force: true, timeout: 30_000 });
  }

  async verifySidePaneOpen(): Promise<void> {
    await expect(this.sidePane).toBeVisible({ timeout: 30_000 });
  }

  async selectSidePaneTab(tabName: string): Promise<void> {
    const tab = this.sidePane.getByRole('tab', { name: tabName });
    await this.robustClick(tab);
    await this.waitForLoadingComplete();
  }

  async closeSidePane(): Promise<void> {
    if ((await this.sidePaneClose.count()) > 0) {
      await this.robustClick(this.sidePaneClose);
    }
  }

  getSidePane(): Locator {
    return this.sidePane;
  }

  getKnativeServiceNode(): Locator {
    return this.knativeServiceNode;
  }

  getEditAnnotationsLink(): Locator {
    return this.editAnnotationsLink;
  }

  getModalTitle(): Locator {
    return this.modalTitle;
  }

  getModalCancel(): Locator {
    return this.modalCancel;
  }

  async clickOnTopologyNode(nodeName: string): Promise<void> {
    await this.switchToGraphView();
    await this.fitScreen();
    const nodeLabel = this.page
      .locator('g[class$="topology__node__label"] text')
      .filter({ hasText: nodeName })
      .first();
    await expect(nodeLabel).toBeVisible({ timeout: 60_000 });
    // eslint-disable-next-line playwright/no-force-option
    await nodeLabel.click({ force: true, timeout: 30_000 });
  }

  async rightClickOnTopologyNode(nodeName: string): Promise<void> {
    await this.switchToGraphView();
    await this.fitScreen();
    const nodeLabel = this.page
      .locator('g[class$="topology__node__label"] text')
      .filter({ hasText: nodeName })
      .first();
    await expect(nodeLabel).toBeVisible({ timeout: 60_000 });
    // eslint-disable-next-line playwright/no-force-option
    await nodeLabel.click({ button: 'right', force: true, timeout: 30_000 });
  }

  async rightClickNodeAndSelectAction(nodeName: string, action: string): Promise<void> {
    await this.rightClickOnTopologyNode(nodeName);
    await this.selectContextMenuAction(action);
  }

  async selectSidebarAction(actionName: string): Promise<void> {
    const actionsButton = this.sidePane.locator(
      '[data-test="actions-menu-button"], [data-test-id="actions-menu-button"]',
    );
    await this.robustClick(actionsButton.first(), { timeout: 10_000 });
    const actionItem = this.page.locator(
      `[data-test="${actionName}"], [data-test-action="${actionName}"]`,
    );
    await this.robustClick(actionItem.first(), { timeout: 10_000 });
  }

  async verifyKnativeRevisionVisible(timeout = 60_000): Promise<void> {
    await expect(this.page.locator('[data-type="knative-revision"]').first()).toBeAttached({ timeout });
  }

  async getRevisionCount(): Promise<number> {
    return this.page.getByTestId('revision-list').locator('li').count();
  }

  async verifyRevisionCount(expected: number, timeout = 60_000): Promise<void> {
    await expect(
      this.page.getByTestId('revision-list').locator('li'),
    ).toHaveCount(expected, { timeout });
  }

  async openServiceAction(namespace: string, serviceName: string, action: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/serving.knative.dev~v1~Service/${serviceName}`);
    const actionsButton = this.page.locator(
      '[data-test="actions-menu-button"], [data-test-id="actions-menu-button"]',
    ).first();
    await this.robustClick(actionsButton, { timeout: 30_000 });
    const actionItem = this.page.locator(
      `[data-test="${action}"], [data-test-action="${action}"]`,
    ).first();
    await this.robustClick(actionItem, { timeout: 10_000 });
  }

  async confirmModalSubmit(): Promise<void> {
    await this.page.locator('button[type=submit]').click();
    await expect(this.modalCancel).not.toBeAttached({ timeout: 10_000 });
  }

  async verifyConfirmActionVisible(): Promise<void> {
    await expect(this.page.locator('[data-test="confirm-action"]')).toBeVisible();
  }

  async editApplicationGrouping(appName: string): Promise<void> {
    await expect(this.modalTitle).toContainText('Edit application grouping');
    const appDropdown = this.page.locator('#form-dropdown-application-name-field');
    const appInput = this.page.getByTestId('application-form-app-input');
    if ((await appDropdown.count()) > 0) {
      await appDropdown.click();
      await this.page.locator(
        '[data-test="#CREATE_APPLICATION_KEY#"], [data-test-dropdown-menu="#CREATE_APPLICATION_KEY#"]',
      ).first().click();
    }
    await appInput.clear();
    await appInput.fill(appName);
    await this.page.locator('button[type=submit]').click();
    await expect(this.modalCancel).not.toBeAttached({ timeout: 10_000 });
  }

  async addTrafficTarget(): Promise<void> {
    await this.page.getByTestId('add-action').click();
  }

  async setTrafficPercent(index: 'first' | 'last', value: string): Promise<void> {
    const field = this.page.locator('[id$="percent-field"]')[index]();
    await field.clear();
    await field.fill(value);
  }

  async selectTrafficTargetRevision(targetIndex: number): Promise<void> {
    await this.page.getByTestId('console-select-menu-toggle').nth(targetIndex).click();
    await this.page.getByTestId('console-select-item').first().click();
  }

  async submitTrafficDistribution(): Promise<void> {
    await this.page.locator('button[type=submit]').click();
  }

  async verifyTrafficDistributionError(expectedText: string): Promise<void> {
    await expect(this.page.locator('div.co-alert div.co-pre-line')).toContainText(expectedText);
  }

  async verifyResourceRemoved(resourceName: string, timeout = 10_000): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('load');
    await this.waitForLoadingComplete();
    await this.search(resourceName);
    await expect(this.highlightedNode).not.toBeAttached({ timeout });
  }
}
