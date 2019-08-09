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

// TODO(vojtech): unit test

/**
 * Check whether the given extension is always-on.
 *
 * The implementation is based on type declarations, i.e. return `true`
 * for extensions whose declared type implements `AlwaysOnExtension`.
 */
const isAlwaysOnExtension = (e: Extension): e is AlwaysOnExtension => {
  return isFeatureFlag(e) || isModelDefinition(e);
};

/**
 * Check whether the given extension is gateable by feature flags.
 */
const isGateableExtension = (e: Extension) => !isAlwaysOnExtension(e);

/**
 * Get flags which are supposed to gate all of the plugin's extensions.
 */
const getGatingFlags = (p: ActivePlugin) => {
  return p.extensions
    .filter(isFeatureFlag)
    .filter((e) => e.properties.gateExtensions)
    .map((e) => e.properties.flag);
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
 * Maintains a list of all Console extensions and provides access to them.
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
   * Get all extensions. Intended mainly for testing purposes.
   */
  public getAllExtensions() {
    return _.clone(this.extensions);
  }
}
