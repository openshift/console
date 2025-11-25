/* eslint-disable no-console */

import {
  FailedPluginInfoEntry,
  LoadedPluginInfoEntry,
  PendingPluginInfoEntry,
  PluginInfoEntry,
  PluginStore as SDKPluginStore,
} from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import type { Extension, LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { ActivePlugin } from './typings/base';

export const sanitizeExtension = <E extends Extension>(e: E): E => {
  e.flags = e.flags || {};
  e.flags.required = _.uniq(e.flags.required || []);
  e.flags.disallowed = _.uniq(e.flags.disallowed || []);
  return e;
};

export const augmentExtension = <E extends Extension>(
  e: E,
  pluginID: string,
  pluginName: string,
  index: number,
): LoadedExtension<E> =>
  Object.assign(e, {
    pluginID,
    pluginName,
    uid: `${pluginID}[${index}]`,
  });

export const getGatingFlagNames = (extensions: Extension[]): string[] =>
  _.uniq([
    ..._.flatMap(extensions.map((e) => e.flags.required)),
    ..._.flatMap(extensions.map((e) => e.flags.disallowed)),
  ]);

/**
 * Provides access to Console plugins and their extensions.
 *
 * Only plugins listed via `allowedDynamicPluginNames` can be added dynamically at runtime.
 *
 * Subscribed `listeners` are invoked upon any of the following events:
 *
 * - when the list of extensions which are currently in use changes
 * - when the runtime status of a dynamic plugin changes
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 */
/**
 * `PluginStore` implementation intended for testing purposes.
 */
export class PluginStore extends SDKPluginStore {
  private readonly allowedDynamicPluginNames: string[];

  constructor(options?: {}, allowedDynamicPluginNames?: string[]) {
    super(options);
    this.allowedDynamicPluginNames = _.uniq(allowedDynamicPluginNames);
  }

  getAllowedDynamicPluginNames() {
    return [...this.allowedDynamicPluginNames];
  }

  /** HACK */
  addActivePlugin(plugin: ActivePlugin): void {
    super.addLoadedPlugin(
      {
        ...plugin,
        version: '0.0.0',
        baseURL: `/static/plugins/${plugin.name}`,
        loadScripts: [],
        registrationMethod: 'callback',
      },
      {
        init: _.noop,
        get: () => Promise.resolve(() => undefined as any),
      },
    );
  }
}

export type LoadedDynamicPluginInfo = LoadedPluginInfoEntry;

export type NotLoadedDynamicPluginInfo = FailedPluginInfoEntry | PendingPluginInfoEntry;

export type DynamicPluginInfo = PluginInfoEntry;
