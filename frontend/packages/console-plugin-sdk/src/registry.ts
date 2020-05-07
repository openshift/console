import * as _ from 'lodash';

import { ActivePlugin, Extension, isKebabActions } from './typings';

// TODO(vojtech): legacy, remove

/**
 * Registry used to query for Console extensions.
 */
export class ExtensionRegistry {
  private readonly extensions: Extension[];

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(plugins.map((p) => p.extensions));
  }

  public getKebabActions() {
    return this.extensions.filter(isKebabActions);
  }
}
