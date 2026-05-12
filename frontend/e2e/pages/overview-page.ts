import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class OverviewPage extends BasePage {
  private readonly controlPlaneSection = this.page.getByTestId('Control Plane');
  private readonly listView: Locator = this.page.locator('.odc-topology-list-view');
  private readonly itemRows: Locator = this.page.locator('.odc-topology-list-view__item-row');
  private readonly kindLabels: Locator = this.page.locator('.odc-topology-list-view__kind-label');
  private readonly labelCells: Locator = this.page.locator('.odc-topology-list-view__label-cell');
  private readonly sidebar: Locator = this.page.locator('.resource-overview');
  private readonly sidebarHeading: Locator = this.page.locator('.resource-overview__heading h1');

  async navigateToOverview(): Promise<void> {
    await this.goTo('/overview');
    await this.waitForLoadingComplete();
  }

  getControlPlaneSection(): Locator {
    return this.controlPlaneSection;
  }

  async navigateViaNav(): Promise<void> {
    await this.waitForLoadingComplete();
    const homeButton = this.page.getByRole('button', { name: 'Home' });
    await this.robustClick(homeButton);
    const overviewLink = this.page.getByRole('link', { name: 'Overview' });
    await this.robustClick(overviewLink);
    await this.waitForLoadingComplete();
  }

  get listViewLocator(): Locator {
    return this.listView;
  }

  get itemRowsLocator(): Locator {
    return this.itemRows;
  }

  get sidebarLocator(): Locator {
    return this.sidebar;
  }

  get sidebarHeadingLocator(): Locator {
    return this.sidebarHeading;
  }

  kindLabel(label: string): Locator {
    return this.kindLabels.filter({ hasText: label });
  }

  labelCell(name: string): Locator {
    return this.labelCells.filter({ hasText: name });
  }

  async navigateToWorkloads(projectName: string): Promise<void> {
    await this.goTo(`/k8s/cluster/projects/${projectName}/workloads?view=list`);
    try {
      await this.listView.waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      await this.retryOnError();
    }
  }

  async clickListItem(name: string): Promise<void> {
    await this.labelCell(name).click();
  }
}
