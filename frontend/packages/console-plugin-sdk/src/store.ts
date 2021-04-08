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
 * Provides access to Console plugin data.
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 */
export class PluginStore {
  // Extensions contributed by static plugins (part of Console application itself)
  private readonly staticPluginExtensions: LoadedExtension[];

  // Extensions contributed by dynamic plugins (loaded from remote hosts at runtime)
  private dynamicPluginExtensions: LoadedExtension[] = [];

  private readonly dynamicPlugins = new Map<string, DynamicPlugin>();

  private readonly listeners: VoidFunction[] = [];

  public constructor(plugins: ActivePlugin[]) {
    this.staticPluginExtensions = _.flatMap(
      plugins.map((p) =>
        p.extensions.map((e, index) =>
          Object.freeze(augmentExtension(sanitizeExtension({ ...e }), p.name, p.name, index)),
        ),
      ),
    );
  }

  public getAllExtensions() {
    return [...this.staticPluginExtensions, ...this.dynamicPluginExtensions];
  }

  public subscribe(listener: VoidFunction): VoidFunction {
    let isSubscribed = true;
    this.listeners.push(listener);

    return () => {
      if (isSubscribed) {
        isSubscribed = false;
        this.listeners.splice(this.listeners.indexOf(listener), 1);
      }
    };
  }

  public addDynamicPlugin(
    pluginID: string,
    manifest: ConsolePluginManifestJSON,
    resolvedExtensions: Extension[],
  ) {
    if (this.dynamicPlugins.has(pluginID)) {
      console.warn(`Attempt to re-add plugin ${pluginID}`);
      return;
    }

    this.dynamicPlugins.set(pluginID, {
      manifest: Object.freeze(manifest),
      processedExtensions: resolvedExtensions.map((e, index) =>
        Object.freeze(augmentExtension(sanitizeExtension(e), pluginID, manifest.name, index)),
      ),
      enabled: false,
    });

    console.log(`Added plugin ${pluginID}`);
  }

  private updateExtensionsAndInvokeListeners() {
    this.dynamicPluginExtensions = Array.from(this.dynamicPlugins.values()).reduce(
      (acc, plugin) => (plugin.enabled ? [...acc, ...plugin.processedExtensions] : acc),
      [],
    );

    this.listeners.forEach((listener) => {
      listener();
    });
  }

  public setDynamicPluginEnabled(pluginID: string, enabled: boolean) {
    if (!this.dynamicPlugins.has(pluginID)) {
      console.warn(`Attempt to ${enabled ? 'enable' : 'disable'} unknown plugin ${pluginID}`);
      return;
    }

    const plugin = this.dynamicPlugins.get(pluginID);

    if (plugin.enabled !== enabled) {
      plugin.enabled = enabled;
      this.updateExtensionsAndInvokeListeners();
      console.log(`Plugin ${pluginID} is now ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  public isDynamicPluginEnabled(pluginID: string): boolean {
    if (!this.dynamicPlugins.has(pluginID)) {
      console.warn(`Attempt to get enabled status for unknown plugin ${pluginID}`);
      return false;
    }

    return this.dynamicPlugins.get(pluginID).enabled;
  }

  public getDynamicPluginMetadata() {
    return Array.from(this.dynamicPlugins.keys()).reduce((acc, pluginID) => {
      const plugin = this.dynamicPlugins.get(pluginID);
      acc[pluginID] = _.omit(plugin.manifest, 'extensions');
      return acc;
    }, {} as { [pluginID: string]: DynamicPluginMetadata });
  }

  public getStateForTestPurposes() {
    return {
      staticPluginExtensions: this.staticPluginExtensions,
      dynamicPluginExtensions: this.dynamicPluginExtensions,
      dynamicPlugins: this.dynamicPlugins,
      listeners: this.listeners,
    };
  }
}

type FlagsObject = { [key: string]: boolean };

type DynamicPluginManifest = Readonly<ConsolePluginManifestJSON>;

type DynamicPluginMetadata = Omit<DynamicPluginManifest, 'extensions'>;

type DynamicPlugin = {
  manifest: DynamicPluginManifest;
  processedExtensions: Readonly<LoadedExtension[]>;
  enabled: boolean;
};
