import * as _ from 'lodash';

import {
  ActivePlugin,
  Extension,
  ExtensionTypeGuard,
  isClusterServiceVersionAction,
  isDashboardsCard,
  isDashboardsInventoryItemGroup,
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewInventoryItem,
  isDashboardsOverviewInventoryItemReplacement,
  isDashboardsOverviewPrometheusActivity,
  isDashboardsOverviewResourceActivity,
  isDashboardsOverviewUtilizationItem,
  isDashboardsTab,
  isDevCatalogModel,
  isFeatureFlag,
  isGlobalConfig,
  isKebabActions,
  isModelDefinition,
  isOverviewCRD,
  isOverviewResourceTab,
  isOverviewTabSection,
  isPerspective,
  isProjectDashboardInventoryItem,
  isReduxReducer,
  isResourceDetailsPage,
  isResourceListPage,
  isRoutePage,
  isYAMLTemplate,
} from './typings';

import { FlagsObject } from '@console/internal/reducers/features';

// TODO(vojtech): legacy, remove

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {
  private readonly extensions: Extension[];

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(plugins.map((p) => p.extensions));
  }

  public getGatingFlagNames(typeGuards: ExtensionTypeGuard<ExtensionWithFlags>[]) {
    return _.flatMap(typeGuards.map((tg) => this.extensions.filter(tg))).reduce(
      (gatingFlags, e) =>
        _.uniq([
          ...gatingFlags,
          ..._.castArray(e.properties.required || []),
          ..._.castArray(e.properties.disallowed || []),
        ]),
      [] as string[],
    );
  }

  public isExtensionInUse(e: ExtensionWithFlags, flags: FlagsObject) {
    const requiredFlags = _.castArray(e.properties.required || []);
    const disallowedFlags = _.castArray(e.properties.disallowed || []);
    return (
      _.every(requiredFlags, (f) => flags[f] === true) &&
      _.every(disallowedFlags, (f) => flags[f] === false)
    );
  }

  public getModelDefinitions() {
    return this.extensions.filter(isModelDefinition);
  }

  public getFeatureFlags() {
    return this.extensions.filter(isFeatureFlag);
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

  public getDashboardsOverviewUtilizationItems() {
    return this.extensions.filter(isDashboardsOverviewUtilizationItem);
  }

  public getDashboardsOverviewInventoryItems() {
    return this.extensions.filter(isDashboardsOverviewInventoryItem);
  }

  public getDashboardsInventoryItemGroups() {
    return this.extensions.filter(isDashboardsInventoryItemGroup);
  }

  public getOverviewResourceTabs() {
    return this.extensions.filter(isOverviewResourceTab);
  }

  public getOverviewTabSections() {
    return this.extensions.filter(isOverviewTabSection);
  }

  public getOverviewCRDs() {
    return this.extensions.filter(isOverviewCRD);
  }

  public getGlobalConfigs() {
    return this.extensions.filter(isGlobalConfig);
  }

  public getClusterServiceVersionActions() {
    return this.extensions.filter(isClusterServiceVersionAction);
  }

  public getKebabActions() {
    return this.extensions.filter(isKebabActions);
  }

  public getDevCatalogModels() {
    return this.extensions.filter(isDevCatalogModel);
  }

  public getDashboardsOverviewResourceActivities() {
    return this.extensions.filter(isDashboardsOverviewResourceActivity);
  }

  public getDashboardsOverviewPrometheusActivities() {
    return this.extensions.filter(isDashboardsOverviewPrometheusActivity);
  }

  public getReduxReducers() {
    return this.extensions.filter(isReduxReducer);
  }

  public getProjectDashboardInventoryItems() {
    return this.extensions.filter(isProjectDashboardInventoryItem);
  }

  public getDashboardsOverviewInventoryItemReplacements() {
    return this.extensions.filter(isDashboardsOverviewInventoryItemReplacement);
  }
}

type ExtensionWithFlags = Extension<{
  required?: string | string[];
  disallowed?: string | string[];
}>;
