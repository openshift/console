import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

import BasePage from './base-page';

export class TopologyPage extends BasePage {
  private readonly switcher = this.page.getByTestId('topology-switcher-view');
  private readonly searchInput = this.page.getByTestId('item-filter');
  private readonly noResourcesFound = this.page.getByTestId('no-resources-found');
  private readonly startBuildingLink = this.page.getByTestId('start-building-your-application');
  private readonly addPageLink = this.page.getByTestId('add-page');
  private readonly filterByResourceDropdown = this.page.getByTestId('filter-by-resource').getByRole('button');
  private readonly displayOptionsButton = this.page
    .getByRole('button')
    .filter({ hasText: 'Display options' });
  private readonly graphSurface = this.page.locator('[data-surface="true"]');
  private readonly confirmAction = this.page.getByTestId('confirm-action');
  private readonly highlightedNode = this.page.locator('.is-filtered');
  private readonly expandToggle = this.page.getByLabel('Collapse groups');

  async navigateToTopology(namespace?: string): Promise<void> {
    const url = namespace ? `/topology/ns/${namespace}` : '/topology';
    await this.goTo(url);
    await this.waitForLoadingComplete(10_000);
  }

  async navigateToTopologyGraph(namespace?: string): Promise<void> {
    const url = namespace
      ? `/topology/ns/${namespace}?view=graph`
      : '/topology?view=graph';
    await this.goTo(url);
    await this.waitForLoadingComplete(10_000);
  }

  getNoResourcesFound(): Locator {
    return this.noResourcesFound;
  }

  getStartBuildingLink(): Locator {
    return this.startBuildingLink;
  }

  getAddPageLink(): Locator {
    return this.addPageLink;
  }

  getFilterByResourceDropdown(): Locator {
    return this.filterByResourceDropdown;
  }

  getSearchInput(): Locator {
    return this.searchInput;
  }

  getDisplayOptionsButton(): Locator {
    return this.displayOptionsButton;
  }

  getSwitcher(): Locator {
    return this.switcher;
  }

  getGraphSurface(): Locator {
    return this.graphSurface;
  }

  async clickStartBuilding(): Promise<void> {
    await this.robustClick(this.startBuildingLink);
  }

  async clickDisplayOptions(): Promise<void> {
    await this.robustClick(this.displayOptionsButton);
  }

  async search(name: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(name);
  }

  async verifyWorkloadVisible(workloadName: string, timeout = 30_000): Promise<void> {
    await this.search(workloadName);
    await expect(this.highlightedNode.first()).toBeAttached({ timeout });
  }

  async verifyGroupLabel(workloadName: string, groupName: string, timeout = 5_000): Promise<void> {
    await this.search(workloadName);
    const label = this.page.locator('g[class$="topology__group__label"]');
    const textContent = label.locator('> text');
    await expect(textContent).toHaveText(groupName);
  }

  getNode(nodeName: string): Locator {
    return this.page
      .locator('g[class$="topology__node__label"]')
      .filter({ hasText: nodeName });
  }

  async clickOnNode(nodeName: string): Promise<void> {
    await this.search(nodeName);
    const node = this.page.getByTestId('base-node-handler');
    await this.robustClick(node.first());
  }

  async rightClickOnNode(nodeName: string): Promise<void> {
    const node = this.getNode(nodeName);
    await expect(node.first()).toBeVisible({ timeout: 30_000 });
    await node.first().click({ button: 'right' });
  }

  async selectContextMenuAction(action: string): Promise<void> {
    const actionButton = this.page.getByRole('menuitem', { name: action })
    await expect(actionButton).toBeVisible({ timeout: 10_000 });
    await this.robustClick(actionButton);
  }

  async clickConfirmAction(): Promise<void> {
    await this.robustClick(this.confirmAction);
  }

  getExpandToggle(): Locator {
    return this.expandToggle;
  }

  getDisplayOptionCheckbox(label: string): Locator {
    return this.page.getByRole('menuitem', {name: label}).getByRole('checkbox');
  }

  async typeInQuickSearch(text: string): Promise<void> {
    await this.page.getByLabel('Quick search bar').fill(text);
  }
}
