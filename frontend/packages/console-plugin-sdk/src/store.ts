import * as _ from 'lodash';
import {
  Extension,
  AlwaysOnExtension,
  ExtensionWithMetadata,
  ActivePlugin,
  isFeatureFlag,
  isModelDefinition,
} from './typings';
import { ExtensionRegistry } from './registry';

/**
 * Always-on extensions are ones whose declared type extends `AlwaysOnExtension`.
 */
export const isAlwaysOnExtension = (e: Extension): e is AlwaysOnExtension => {
  return isFeatureFlag(e) || isModelDefinition(e);
};

export const isGatedExtension = (e: Extension): boolean => !isAlwaysOnExtension(e);

export const sanitizeExtension = (e: Extension): Extension => {
  if (isGatedExtension(e)) {
    e.flags = e.flags || {};
    e.flags.required = _.uniq(e.flags.required || []);
    e.flags.disallowed = _.uniq(e.flags.disallowed || []);
  } else if (e.flags !== undefined) {
    // eslint-disable-next-line no-console
    console.warn('Discarding flags for always-on extension:', e);
    delete e.flags;
  }
  return e;
};

export const augmentExtension = (e: Extension, p: ActivePlugin): ExtensionWithMetadata => {
  return Object.assign(e, { plugin: p.name });
};

export const isExtensionInUse = (e: Extension, flags: FlagsObject): boolean =>
  e.flags.required.every((f) => flags[f] === true) &&
  e.flags.disallowed.every((f) => flags[f] === false);

export const collectFlags = (
  extensions: Extension[],
  collector: (extensionFlags: Extension['flags']) => string[],
): string[] =>
  _.uniq(_.flatMap(extensions.map((e) => (isGatedExtension(e) ? collector(e.flags) : []))));

export const getGatingFlagNames = (extensions: Extension[]): string[] =>
  _.uniq([
    ...collectFlags(extensions, (extensionFlags) => extensionFlags.required),
    ...collectFlags(extensions, (extensionFlags) => extensionFlags.disallowed),
  ]);

/**
 * Provides access to Console plugin data.
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 *
 * _For now, the runtime list of extensions is assumed to be immutable._
 */
export class PluginStore {
  private readonly extensions: ExtensionWithMetadata[];

  public readonly registry: ExtensionRegistry; // TODO(vojtech): legacy, remove

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(
      plugins.map((p) =>
        p.extensions.map((e) => Object.freeze(augmentExtension(sanitizeExtension({ ...e }), p))),
      ),
    );
    this.registry = new ExtensionRegistry(plugins);
  }

  public getAllExtensions(): readonly Extension[] {
    return this.extensions;
  }
}

type FlagsObject = { [key: string]: boolean };
