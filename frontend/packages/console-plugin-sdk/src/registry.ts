import * as _ from 'lodash';
import {
  Extension,
  ActivePlugin,
  isModelDefinition,
  isFeatureFlag,
  isNavItem,
  isResourceListPage,
  isResourceDetailsPage,
  isPerspective,
  isYAMLTemplate,
  isRoutePage,
  isDashboardsOverviewHealthSubsystem,
  isDashboardsCard,
  isDashboardsTab,
  isDashboardsOverviewInventoryItem,
  isDashboardsInventoryItemGroup,
  isDashboardsOverviewQuery,
  isDashboardsOverviewUtilizationItem,
  isDashboardsOverviewTopConsumerItem,
  isOverviewResourceTab,
  isOverviewCRD,
  isGlobalConfig,
} from './typings';

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {
  private readonly extensions: Extension[];

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(plugins.map((p) => p.extensions));
  }

  public getModelDefinitions() {
    return this.extensions.filter(isModelDefinition);
  }

  public getFeatureFlags() {
    return this.extensions.filter(isFeatureFlag);
  }

  public getNavItems() {
    return this.extensions.filter(isNavItem);
  }

  public getResourceListPages() {
    return this.extensions.filter(isResourceListPage);
  }

  public getResourceDetailsPages() {
    return this.extensions.filter(isResourceDetailsPage);
  }

  public getRoutePages() {
    return this.extensions.filter(isRoutePage);
  }

  public getPerspectives() {
    return this.extensions.filter(isPerspective);
  }

  public getYAMLTemplates() {
    return this.extensions.filter(isYAMLTemplate);
  }

  public getDashboardsOverviewHealthSubsystems() {
    return this.extensions.filter(isDashboardsOverviewHealthSubsystem);
  }

  public getDashboardsTabs() {
    return this.extensions.filter(isDashboardsTab);
  }

  public getDashboardsCards() {
    return this.extensions.filter(isDashboardsCard);
  }

  public getDashboardsOverviewQueries() {
    return this.extensions.filter(isDashboardsOverviewQuery);
  }

  public getDashboardsOverviewUtilizationItems() {
    return this.extensions.filter(isDashboardsOverviewUtilizationItem);
  }

  public getDashboardsOverviewInventoryItems() {
    return this.extensions.filter(isDashboardsOverviewInventoryItem);
  }

  public getDashboardsInventoryItemGroups() {
    return this.extensions.filter(isDashboardsInventoryItemGroup);
  }

  public getDashboardsOverviewTopConsumerItems() {
    return this.extensions.filter(isDashboardsOverviewTopConsumerItem);
  }

  public getOverviewResourceTabs() {
    return this.extensions.filter(isOverviewResourceTab);
  }

  public getOverviewCRDs() {
    return this.extensions.filter(isOverviewCRD);
  }

  public getGlobalConfigs() {
    return this.extensions.filter(isGlobalConfig);
  }
}
