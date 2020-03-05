import * as _ from 'lodash';

import {
  ActivePlugin,
  Extension,
  ExtensionTypeGuard,
  isClusterServiceVersionAction,
  isDevCatalogModel,
  isFeatureFlag,
  isGlobalConfig,
  isModelDefinition,
  isOverviewCRD,
  isOverviewResourceTab,
  isOverviewTabSection,
  isPerspective,
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

  public getDevCatalogModels() {
    return this.extensions.filter(isDevCatalogModel);
  }

  public getReduxReducers() {
    return this.extensions.filter(isReduxReducer);
  }
}

type ExtensionWithFlags = Extension<{
  required?: string | string[];
  disallowed?: string | string[];
}>;
