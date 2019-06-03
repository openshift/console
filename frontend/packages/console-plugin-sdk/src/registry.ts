import * as _ from 'lodash-es';

import {
  Extension,
  ActivePlugin,
  isModelDefinition,
  isFeatureFlag,
  isNavItem,
  isResourcePage,
  isPerspective,
  isYAMLTemplate,
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

  public getResourcePages() {
    return this.extensions.filter(isResourcePage);
  }

  public getPerspectives() {
    return this.extensions.filter(isPerspective);
  }

  public getYAMLTemplates() {
    return this.extensions.filter(isYAMLTemplate);
  }
}
