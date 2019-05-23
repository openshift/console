import * as _ from 'lodash-es';

import {
  Extension,
  ActivePlugin,
  isModelDefinition,
  isFeatureFlag,
  isNavItem,
  isResourcePage,
} from './typings';

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {

  private readonly extensions: Extension<any>[];

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(plugins.map(p => p.extensions));
  }

  public getModelDefinitions() {
    return this.extensions.filter(isModelDefinition);
  }

  public getFeatureFlags() {
    return this.extensions.filter(isFeatureFlag);
  }

  public getNavItems(section: string) {
    return this.extensions.filter(isNavItem).filter(e => e.properties.section === section);
  }

  public getResourcePages() {
    return this.extensions.filter(isResourcePage);
  }

}
