import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class ProjectDashboardPage extends BasePage {
  private readonly detailsCard = this.page.getByTestId('details-card');
  private readonly statusCard = this.page.getByTestId('status-card');
  private readonly inventoryCard = this.page.getByTestId('inventory-card');
  private readonly utilizationCard = this.page.getByTestId('utilization-card');
  private readonly launcherCard = this.page.getByTestId('launcher-card');
  private readonly resourceQuotasCard = this.page.getByTestId('resource-quotas-card');
  private readonly detailItemTitle = this.page.getByTestId('detail-item-title');
  private readonly detailItemValue = this.page.getByTestId('detail-item-value');
  private readonly viewAllLink = this.page.getByTestId('details-card-view-all');
  private readonly projectStatus = this.page.getByTestId('project-status');
  private readonly resourceInventoryItem = this.page.getByTestId('resource-inventory-item');
  private readonly utilizationItem = this.page.getByTestId('utilization-item');
  private readonly utilizationItemTitle = this.page.getByTestId('utilization-item-title');
  private readonly durationSelect = this.page.getByTestId('duration-select');
  private readonly launcherItem = this.page.getByTestId('launcher-item');
  private readonly resourceQuotaLink = this.page.getByTestId('resource-quota-link');
  private readonly resourceQuotaGaugeChart = this.page.getByTestId('resource-quota-gauge-chart');

  async navigateToProject(projectName: string): Promise<void> {
    await this.goTo(`/k8s/cluster/projects/${projectName}`);
  }

  getDetailsCard(): Locator {
    return this.detailsCard;
  }

  getStatusCard(): Locator {
    return this.statusCard;
  }

  getInventoryCard(): Locator {
    return this.inventoryCard;
  }

  getUtilizationCard(): Locator {
    return this.utilizationCard;
  }

  getLauncherCard(): Locator {
    return this.launcherCard;
  }

  getResourceQuotasCard(): Locator {
    return this.resourceQuotasCard;
  }

  getDetailItemTitle(): Locator {
    return this.detailItemTitle;
  }

  getDetailItemValue(): Locator {
    return this.detailItemValue;
  }

  getViewAllLink(): Locator {
    return this.viewAllLink;
  }

  getProjectStatus(): Locator {
    return this.projectStatus;
  }

  getResourceInventoryItem(): Locator {
    return this.resourceInventoryItem;
  }

  getUtilizationItem(): Locator {
    return this.utilizationItem;
  }

  getUtilizationItemTitle(): Locator {
    return this.utilizationItemTitle;
  }

  getDurationSelect(): Locator {
    return this.durationSelect;
  }

  getLauncherItem(): Locator {
    return this.launcherItem;
  }

  getResourceQuotaLink(): Locator {
    return this.resourceQuotaLink;
  }

  getResourceQuotaGaugeChart(): Locator {
    return this.resourceQuotaGaugeChart;
  }
}
