import * as _ from 'lodash-es';

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
} from './typings';

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {
  private readonly extensions: Extension<any>[];

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
}
