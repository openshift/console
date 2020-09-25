import * as _ from 'lodash';
import { Extension, LoadedExtension, ActivePlugin } from './typings';
import { ExtensionRegistry } from './registry';

export const sanitizeExtension = (e: Extension): Extension => {
  e.flags = e.flags || {};
  e.flags.required = _.uniq(e.flags.required || []);
  e.flags.disallowed = _.uniq(e.flags.disallowed || []);
  return e;
};

export const augmentExtension = (
  e: Extension,
  pluginName: string,
  index: number,
): LoadedExtension<typeof e> =>
  Object.assign(e, {
    pluginName,
    uid: `${pluginName}[${index}]`,
  });

export const isExtensionInUse = (e: Extension, flags: FlagsObject): boolean =>
  e.flags.required.every((f) => flags[f] === true) &&
  e.flags.disallowed.every((f) => flags[f] === false);

export const getGatingFlagNames = (extensions: Extension[]): string[] =>
  _.uniq([
    ..._.flatMap(extensions.map((e) => e.flags.required)),
    ..._.flatMap(extensions.map((e) => e.flags.disallowed)),
  ]);

/**
 * Provides access to Console plugin data.
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 *
 * _For now, the runtime list of extensions is assumed to be immutable._
 */
export class PluginStore {
  private readonly extensions: Extension[];

  public readonly registry: ExtensionRegistry; // TODO(vojtech): legacy, remove

  public constructor(plugins: ActivePlugin[]) {
    this.extensions = _.flatMap(
      plugins.map((p) =>
        p.extensions.map((e, index) =>
          Object.freeze(augmentExtension(sanitizeExtension({ ...e }), p.name, index)),
        ),
      ),
    );
    this.registry = new ExtensionRegistry(plugins);
  }

  public getAllExtensions(): readonly Extension[] {
    return this.extensions;
  }
}

type FlagsObject = { [key: string]: boolean };
