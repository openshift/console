import * as _ from 'lodash';
import { FlagsObject } from '@console/internal/reducers/features';
import {
  Extension,
  ExtensionTypeGuard,
  ActivePlugin,
  isModelDefinition,
  isModelFeatureFlag,
  isActionFeatureFlag,
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
  isDashboardsOverviewUtilizationItem,
  isOverviewResourceTab,
  isOverviewCRD,
  isOverviewTabSection,
  isGlobalConfig,
  isClusterServiceVersionAction,
  isKebabActions,
  isDevCatalogModel,
  isDashboardsOverviewResourceActivity,
  isDashboardsOverviewPrometheusActivity,
  isProjectDashboardInventoryItem,
  isReduxReducer,
  isDashboardsOverviewInventoryItemReplacement,
} from './typings';

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {
  private readonly extensions: Extension[];

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(plugins.map((p) => p.extensions));
  }

  public get<E extends Extension>(typeGuard: ExtensionTypeGuard<E>): E[] {
    return this.extensions.filter(typeGuard);
  }

  public getRequiredFlags(typeGuards: ExtensionTypeGuard<ExtensionWithFlags>[]) {
    return _.flatMap(typeGuards.map((tg) => this.extensions.filter(tg)))
      .filter((e) => e.properties.required)
      .reduce(
        (requiredFlags, e) => _.uniq([...requiredFlags, ..._.castArray(e.properties.required)]),
        [] as string[],
      );
  }

  public isExtensionInUse(e: ExtensionWithFlags, flags: FlagsObject) {
    const requiredFlags = e.properties.required ? _.castArray(e.properties.required) : [];
    return _.every(requiredFlags, (f) => flags[f]);
  }

  public getModelDefinitions() {
    return this.extensions.filter(isModelDefinition);
  }

  public getModelFeatureFlags() {
    return this.extensions.filter(isModelFeatureFlag);
  }

  public getActionFeatureFlags() {
    return this.extensions.filter(isActionFeatureFlag);
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

type ExtensionWithFlags = Extension<{ required?: string | string[] }>;
