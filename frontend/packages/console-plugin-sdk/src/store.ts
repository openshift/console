/* eslint-disable no-console */

import * as _ from 'lodash';
import { ConsolePluginManifestJSON } from '@console/dynamic-plugin-sdk/src/schema/plugin-manifest';
import { Extension, LoadedExtension, ActivePlugin } from './typings';

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

export const isExtensionInUse = (e: Extension, flags: FlagsObject): boolean =>
  e.flags.required.every((f) => flags[f] === true) &&
  e.flags.disallowed.every((f) => flags[f] === false);

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
export class PluginStore {
  // Extensions contributed by static plugins (part of Console application itself)
  private readonly staticPluginExtensions: LoadedExtension[];

  // Extensions contributed by dynamic plugins (loaded from remote hosts at runtime)
  private dynamicPluginExtensions: LoadedExtension[] = [];

  // Dynamic plugins that were loaded successfully
  private readonly loadedDynamicPlugins = new Map<string, LoadedDynamicPlugin>();

  // Dynamic plugins that failed to load properly
  private readonly failedDynamicPluginNames = new Set<string>();

  private readonly listeners: VoidFunction[] = [];

  constructor(
    staticPlugins: ActivePlugin[] = [],
    private readonly allowedDynamicPluginNames: Set<string> = new Set(),
  ) {
    this.staticPluginExtensions = _.flatMap(
      staticPlugins.map((p) =>
        p.extensions.map((e, index) =>
          Object.freeze(augmentExtension(sanitizeExtension({ ...e }), p.name, p.name, index)),
        ),
      ),
    );
  }

  getAllExtensions() {
    return [...this.staticPluginExtensions, ...this.dynamicPluginExtensions];
  }

  subscribe(listener: VoidFunction): VoidFunction {
    let isSubscribed = true;
    this.listeners.push(listener);

    return () => {
      if (isSubscribed) {
        isSubscribed = false;
        this.listeners.splice(this.listeners.indexOf(listener), 1);
      }
    };
  }

  private invokeListeners() {
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  addDynamicPlugin(
    pluginID: string,
    manifest: ConsolePluginManifestJSON,
    resolvedExtensions: Extension[],
  ) {
    if (this.loadedDynamicPlugins.has(pluginID)) {
      console.warn(`Attempt to re-add plugin ${pluginID}`);
      return;
    }

    if (!this.allowedDynamicPluginNames.has(manifest.name)) {
      console.warn(`Attempt to add unexpected plugin ${pluginID}`);
      return;
    }

    if (this.failedDynamicPluginNames.has(manifest.name)) {
      console.warn(`Attempt to add plugin ${pluginID} previously marked as failed`);
      return;
    }

    this.loadedDynamicPlugins.set(pluginID, {
      manifest: Object.freeze(manifest),
      processedExtensions: resolvedExtensions.map((e, index) =>
        Object.freeze(augmentExtension(sanitizeExtension(e), pluginID, manifest.name, index)),
      ),
      enabled: false,
    });

    this.invokeListeners();

    console.log(`Added plugin ${pluginID}`);
  }

  private updateExtensions() {
    this.dynamicPluginExtensions = Array.from(this.loadedDynamicPlugins.values()).reduce(
      (acc, plugin) => (plugin.enabled ? [...acc, ...plugin.processedExtensions] : acc),
      [],
    );
  }

  setDynamicPluginEnabled(pluginID: string, enabled: boolean) {
    if (!this.loadedDynamicPlugins.has(pluginID)) {
      console.warn(`Attempt to ${enabled ? 'enable' : 'disable'} unknown plugin ${pluginID}`);
      return;
    }

    const plugin = this.loadedDynamicPlugins.get(pluginID);

    if (plugin.enabled !== enabled) {
      plugin.enabled = enabled;

      this.updateExtensions();
      this.invokeListeners();

      console.log(`Plugin ${pluginID} is now ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  private isDynamicPluginLoaded(pluginName: string) {
    return Array.from(this.loadedDynamicPlugins.values()).some(
      (plugin) => plugin.manifest.name === pluginName,
    );
  }

  registerFailedDynamicPlugin(pluginName: string) {
    if (!this.allowedDynamicPluginNames.has(pluginName)) {
      console.warn(`Attempt to register unexpected plugin ${pluginName} as failed`);
      return;
    }

    if (this.isDynamicPluginLoaded(pluginName)) {
      console.warn(`Attempt to register an already loaded plugin ${pluginName} as failed`);
      return;
    }

    this.failedDynamicPluginNames.add(pluginName);
    this.invokeListeners();
  }

  getDynamicPluginInfo(): DynamicPluginInfo[] {
    const loadedPluginEntries = Array.from(this.loadedDynamicPlugins.keys()).reduce(
      (acc, pluginID) => {
        const plugin = this.loadedDynamicPlugins.get(pluginID);
        acc.push({
          status: 'Loaded',
          pluginID,
          metadata: _.omit(plugin.manifest, 'extensions'),
          enabled: plugin.enabled,
        });
        return acc;
      },
      [] as LoadedDynamicPluginInfo[],
    );

    const failedPluginEntries = Array.from(this.failedDynamicPluginNames.values()).reduce(
      (acc, pluginName) => {
        acc.push({
          status: 'Failed',
          pluginName,
        });
        return acc;
      },
      [] as NotLoadedDynamicPluginInfo[],
    );

    const pendingPluginEntries = Array.from(this.allowedDynamicPluginNames.values())
      .filter(
        (pluginName) =>
          !this.isDynamicPluginLoaded(pluginName) && !this.failedDynamicPluginNames.has(pluginName),
      )
      .reduce((acc, pluginName) => {
        acc.push({
          status: 'Pending',
          pluginName,
        });
        return acc;
      }, [] as NotLoadedDynamicPluginInfo[]);

    return [...loadedPluginEntries, ...failedPluginEntries, ...pendingPluginEntries];
  }

  getStateForTestPurposes() {
    return {
      staticPluginExtensions: this.staticPluginExtensions,
      dynamicPluginExtensions: this.dynamicPluginExtensions,
      loadedDynamicPlugins: this.loadedDynamicPlugins,
      failedDynamicPluginNames: this.failedDynamicPluginNames,
      listeners: this.listeners,
    };
  }
}

type FlagsObject = { [key: string]: boolean };

type DynamicPluginManifest = Readonly<ConsolePluginManifestJSON>;

type DynamicPluginMetadata = Omit<DynamicPluginManifest, 'extensions'>;

type LoadedDynamicPlugin = {
  manifest: DynamicPluginManifest;
  processedExtensions: Readonly<LoadedExtension[]>;
  enabled: boolean;
};

export type LoadedDynamicPluginInfo = {
  status: 'Loaded';
  pluginID: string;
  metadata: DynamicPluginMetadata;
  enabled: boolean;
};

export type NotLoadedDynamicPluginInfo = {
  status: 'Pending' | 'Failed';
  pluginName: string;
};

export type DynamicPluginInfo = LoadedDynamicPluginInfo | NotLoadedDynamicPluginInfo;

export const isLoadedDynamicPluginInfo = (i: DynamicPluginInfo): i is LoadedDynamicPluginInfo =>
  i.status === 'Loaded';
