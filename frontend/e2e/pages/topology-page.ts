import type { Locator } from '@playwright/test';
import { expect } from '../fixtures';

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
  private readonly highlightedNode = this.page.getByTestId('filtered-node');
  private readonly expandToggle = this.page.getByLabel('Collapse groups');

  // Form interaction locators
  private readonly gitRepoUrlField = this.page.getByLabel('Git Repo URL');
  private readonly gitUrlHelper = this.page.getByTestId('form-input-git-url-field-helper');
  private readonly applicationNameField = this.page.getByTestId('form-input-application-name-field');
  private readonly workloadNameField = this.page.getByTestId('form-input-name-field');
  private readonly resourceTypeField = this.page.getByTestId('form-select-input-resources-field');
  private readonly saveChangesButton = this.page.getByTestId('save-changes');
  private readonly applicationDropdown = this.page.getByTestId('form-dropdown-application-name-field');
  private readonly sidebarCloseButton = this.page.getByTestId('sidebar-close-button');

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
    await this.ensureGraphView();
    await this.robustClick(this.displayOptionsButton);
  }

  async search(name: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(name);
  }

  async verifyWorkloadVisible(workloadName: string, timeout = 30_000): Promise<void> {
    await this.ensureGraphView();
    await this.search(workloadName);
    await expect(this.highlightedNode.first()).toBeAttached({ timeout });
  }

  // PF Topology internal class — no data-test available; may break on PF upgrades
  async verifyGroupLabel(workloadName: string, groupName: string, timeout = 15_000): Promise<void> {
    await this.ensureGraphView();
    await this.search(workloadName);
    const label = this.page.locator('g[class$="topology__group__label"]');
    const textContent = label.locator('> text');
    await expect(textContent).toHaveText(groupName, { timeout });
  }

  // PF Topology internal class — no data-test available; may break on PF upgrades
  getNode(nodeName: string): Locator {
    return this.page
      .locator('g[class$="topology__node__label"]')
      .filter({ hasText: nodeName });
  }

  async ensureGraphView(): Promise<void> {
    const currentLabel = await this.switcher.getAttribute('aria-label');
    if (currentLabel === 'Graph view') {
      // Currently in List view, need to switch to Graph view
      await this.robustClick(this.switcher);
    }
  }

  async clickOnNode(nodeName: string): Promise<void> {
    await this.ensureGraphView();
    await this.search(nodeName);
    await expect(this.highlightedNode.first()).toBeVisible({ timeout: 30_000 });
    const handler = this.highlightedNode.getByTestId('base-node-handler').first();
    await expect(handler).toBeVisible({ timeout: 30_000 });
    await this.robustClick(handler);
  }

  async rightClickOnNode(nodeName: string): Promise<void> {
    await this.ensureGraphView();
    await this.search(nodeName);
    // Wait for search to filter and highlight the node
    await expect(this.highlightedNode.first()).toBeVisible({ timeout: 30_000 });

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
    return this.page.getByRole('menuitem', { name: label }).getByRole('checkbox');
  }

  async typeInQuickSearch(text: string): Promise<void> {
    await this.page.getByLabel('Quick search bar').fill(text);
  }

  // Import form interaction methods
  async fillGitRepoUrl(url: string): Promise<void> {
    await this.gitRepoUrlField.clear();
    await this.gitRepoUrlField.fill(url);
  }

  async waitForGitUrlValidation(timeout = 120_000): Promise<void> {
    await expect(this.gitUrlHelper).toContainText('Validated', { timeout });
  }

  async fillWorkloadName(name: string): Promise<void> {
    await this.workloadNameField.fill(name);
  }

  async selectResourceType(resourceType: 'kubernetes' | 'knative'): Promise<void> {
    await this.resourceTypeField.scrollIntoViewIfNeeded();
    await this.resourceTypeField.click();
    await this.page.locator(`#select-option-resources-${resourceType}`).click();
  }

  async clickSaveChanges(): Promise<void> {
    await this.robustClick(this.saveChangesButton);
  }

  async clickApplicationDropdown(): Promise<void> {
    await expect(this.applicationDropdown).toBeVisible({ timeout: 30_000 });
    await this.applicationDropdown.click();
  }

  async selectFirstApplicationOption(): Promise<void> {
    await this.page.getByTestId('console-select-item').first().click();
  }

  async fillApplicationName(appName: string): Promise<void> {
    await expect(this.applicationNameField).toBeVisible();
    await this.applicationNameField.fill(appName);
    await expect(this.applicationNameField).toHaveValue(appName);
  }

  async closeSidebarIfOpen(): Promise<void> {
    if (await this.sidebarCloseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.sidebarCloseButton.click();
    }
  }

  // Catalog/quick search methods
  async clickBuilderImageItem(imageName: string): Promise<void> {
    await this.page.getByTestId(`item-name-${imageName}`).first().click();
  }

  async selectBuilderImageFromList(pattern: RegExp): Promise<void> {
    await expect(this.page.getByRole('progressbar')).not.toBeAttached({ timeout: 60_000 });
    await this.page
      .getByRole('listitem')
      .filter({ hasText: pattern })
      .first()
      .click();
  }

  async clickCreateButton(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create' }).click();
  }

  getApplicationFormInput(): Locator {
    return this.applicationNameField;
  }

}
