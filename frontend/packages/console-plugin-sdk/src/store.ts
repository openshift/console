import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import {
  Extension,
  AlwaysOnExtension,
  ActivePlugin,
  isFeatureFlag,
  isModelDefinition,
} from './typings';
import { ExtensionRegistry } from './registry';

const isAlwaysOnExtension = (e: Extension): e is AlwaysOnExtension => {
  return isFeatureFlag(e) || isModelDefinition(e);
};

const isGateableExtension = (e: Extension) => !isAlwaysOnExtension(e);

const getGatingFlags = (p: ActivePlugin) => {
  return [
    ...p.extensions
      .filter(isFeatureFlag)
      .filter((e) => e.properties.gateExtensions === undefined || e.properties.gateExtensions)
      .map((e) => e.properties.flag),
  ];
};

const sanitizeExtension = (e: Extension) => {
  if (isGateableExtension(e)) {
    e.flags = e.flags || {};
    e.flags.required = _.uniq(e.flags.required || []);
    e.flags.disallowed = _.uniq(e.flags.disallowed || []);
  }
  return e;
};

/**
 * Maintains a list of all Console extensions and provides access to ones which
 * are currently in use.
 *
 * TODO(vojtech): unit test
 */
export class PluginStore {
  private readonly extensions: Extension[];

  readonly registry: ExtensionRegistry; // TODO(vojtech): legacy, remove

  public constructor(plugins: ActivePlugin[]) {
    plugins.forEach((p) => {
      // sanitize
      p.extensions = p.extensions.map(sanitizeExtension);

      // post-process
      getGatingFlags(p).forEach((flag) => {
        p.extensions.filter(isGateableExtension).forEach((e) => {
          e.flags.required = _.uniq([...e.flags.required, flag]);
        });
      });

      // TODO(vojtech): freeze, making extension objects effectively immutable
    });

    this.extensions = _.flatMap(plugins.map((p) => p.extensions));
    this.registry = new ExtensionRegistry(this.extensions);
  }

  /**
   * Get extensions that are currently in use:
   * - always-on extensions will be included
   * - extensions whose `flags` constraints are satisfied will be included
   */
  public getExtensionsInUse(flags: ImmutableMap<string, boolean>) {
    const isPending = (f: string) => flags.get(f) === undefined;
    const isEnabled = (f: string) => flags.get(f) === true;

    return [
      ...this.getAlwaysOnExtensions(),
      ...this.extensions.filter(isGateableExtension).filter((e) => {
        return (
          e.flags.required.every((f) => !isPending(f) && isEnabled(f)) &&
          e.flags.disallowed.every((f) => !isPending(f) && !isEnabled(f))
        );
      }),
    ];
  }

  /**
   * Get always-on extensions. This list isn't expected to change over time.
   */
  public getAlwaysOnExtensions() {
    return this.extensions.filter(isAlwaysOnExtension);
  }

  /**
   * For testing purposes only.
   */
  public getAllExtensions() {
    return _.clone(this.extensions);
  }
}
