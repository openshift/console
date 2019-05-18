import * as _ from 'lodash-es';
import { Extension, PluginList, isNavItem, isResourcePage, isFeatureFlag } from './typings';

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {

  private readonly extensions: Extension<any>[];

  public constructor(plugins: PluginList) {
    this.extensions = _.flatMap(plugins);
  }

  public getNavItems(section: string) {
    return this.extensions.filter(isNavItem).filter(e => e.properties.section === section);
  }

  public getResourcePages() {
    return this.extensions.filter(isResourcePage);
  }

  public getFeatureFlags() {
    return this.extensions.filter(isFeatureFlag);
  }

}
