/* eslint-disable no-console */

import * as _ from 'lodash';
import { StandardConsolePluginManifest } from '@console/dynamic-plugin-sdk/src/build-types';
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
  e.flags.required.every((f) => flags[f]) && e.flags.disallowed.every((f) => !flags[f]);

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
  // Extensions contributed by static plugins which are currently in use
  private staticPluginExtensions: LoadedExtension[];

  // Extensions contributed by dynamic plugins which are currently in use
  private dynamicPluginExtensions: LoadedExtension[];

  private i18nNamespaces: Set<string>;

  private readonly staticPlugins: StaticPlugin[];

  // Static plugins that were disabled by loading replacement dynamic plugins
  private readonly disabledStaticPluginNames = new Set<string>();

  private readonly allowedDynamicPluginNames: Set<string>;

  // Dynamic plugins that were loaded successfully (keys are plugin IDs)
  private readonly loadedDynamicPlugins = new Map<string, LoadedDynamicPlugin>();

  // Dynamic plugins that failed to load properly (keys are plugin names)
  private readonly failedDynamicPlugins = new Map<string, FailedDynamicPlugin>();

  private readonly listeners: VoidFunction[] = [];

  constructor(
    staticPlugins: ActivePlugin[] = [],
    allowedDynamicPluginNames: string[] = [],
    i18nNamespaces: string[] = [],
  ) {
    this.staticPlugins = staticPlugins.map((plugin) => ({
      name: plugin.name,
      extensions: plugin.extensions.map((e, index) =>
        Object.freeze(
          augmentExtension(sanitizeExtension({ ...e }), plugin.name, plugin.name, index),
        ),
      ),
    }));

    this.allowedDynamicPluginNames = new Set(allowedDynamicPluginNames);
    this.i18nNamespaces = new Set(i18nNamespaces);
    this.updateExtensions();
  }

  getExtensionsInUse() {
    return [...this.staticPluginExtensions, ...this.dynamicPluginExtensions];
  }

  getAllowedDynamicPluginNames() {
    return Array.from(this.allowedDynamicPluginNames);
  }

  getI18nNamespaces() {
    return Array.from(this.i18nNamespaces);
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
    manifest: StandardConsolePluginManifest,
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

    if (this.failedDynamicPlugins.has(manifest.name)) {
      console.warn(`Attempt to add plugin ${pluginID} previously marked as failed`);
      return;
    }

    this.loadedDynamicPlugins.set(pluginID, {
      manifest: Object.freeze(manifest),
      processedExtensions: resolvedExtensions.map((e, index) =>
        Object.freeze(augmentExtension(sanitizeExtension(e), pluginID, manifest.name, index)),
      ),
      enabled: false,
      customInfo: {},
    });

    (manifest.customProperties?.console?.disableStaticPlugins ?? [])
      .filter(
        (pluginName) =>
          !this.disabledStaticPluginNames.has(pluginName) &&
          this.staticPlugins.some((plugin) => plugin.name === pluginName),
      )
      .forEach((pluginName) => {
        console.log(`Static plugin ${pluginName} will be disabled`);
        this.disabledStaticPluginNames.add(pluginName);
      });

    this.updateExtensions();
    this.invokeListeners();

    console.log(`Added plugin ${pluginID}`);
  }

  private updateExtensions() {
    const dynamicPlugins = Array.from(this.loadedDynamicPlugins.values());

    this.staticPluginExtensions = this.staticPlugins
      .filter((plugin) => !this.disabledStaticPluginNames.has(plugin.name))
      .reduce((acc, plugin) => [...acc, ...plugin.extensions], [] as LoadedExtension[]);

    this.dynamicPluginExtensions = dynamicPlugins.reduce(
      (acc, plugin) => (plugin.enabled ? [...acc, ...plugin.processedExtensions] : acc),
      [] as LoadedExtension[],
    );
  }

  setDynamicPluginEnabled(pluginID: string, enabled: boolean) {
    if (!this.loadedDynamicPlugins.has(pluginID)) {
      console.warn(
        `Attempt to ${
          enabled ? 'enable' : 'disable'
        } plugin ${pluginID} that has not been loaded yet`,
      );
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

  private getLoadedDynamicPlugin(pluginName: string) {
    return Array.from(this.loadedDynamicPlugins.values()).find(
      (plugin) => plugin.manifest.name === pluginName,
    );
  }

  private isDynamicPluginLoaded(pluginName: string) {
    return this.getLoadedDynamicPlugin(pluginName) !== undefined;
  }

  private isDynamicPluginFailed(pluginName: string) {
    return this.failedDynamicPlugins.has(pluginName);
  }

  registerFailedDynamicPlugin(pluginName: string, errorMessage: string, errorCause?: unknown) {
    if (!this.allowedDynamicPluginNames.has(pluginName)) {
      console.warn(`Attempt to register unexpected plugin ${pluginName} as failed`);
      return;
    }

    if (this.isDynamicPluginLoaded(pluginName)) {
      console.warn(`Attempt to register an already loaded plugin ${pluginName} as failed`);
      return;
    }

    this.failedDynamicPlugins.set(pluginName, { errorMessage, errorCause });
    this.invokeListeners();
  }

  setCustomDynamicPluginInfo(pluginName: string, data: CustomDynamicPluginInfo) {
    const plugin = this.getLoadedDynamicPlugin(pluginName);

    if (!plugin) {
      console.warn(
        `Attempt to set custom data for plugin ${pluginName} that has not been loaded yet`,
      );
      return;
    }

    const oldData = plugin.customInfo;
    const newData = _.merge({}, plugin.customInfo, data);

    if (!_.isEqual(oldData, newData)) {
      plugin.customInfo = newData;

      this.invokeListeners();
    }
  }

  getDynamicPluginInfo(): DynamicPluginInfo[] {
    const loadedPluginEntries = Array.from(this.loadedDynamicPlugins.entries()).reduce(
      (acc, [pluginID, plugin]) => {
        acc.push({
          status: 'Loaded',
          pluginID,
          metadata: _.omit(plugin.manifest, ['extensions', 'loadScripts', 'registrationMethod']),
          enabled: plugin.enabled,
          ...plugin.customInfo,
        });
        return acc;
      },
      [] as LoadedDynamicPluginInfo[],
    );

    const failedPluginEntries = Array.from(this.failedDynamicPlugins.entries()).reduce(
      (acc, [pluginName, plugin]) => {
        acc.push({
          status: 'Failed',
          pluginName,
          errorMessage: plugin.errorMessage,
          errorCause: plugin.errorCause,
        });
        return acc;
      },
      [] as NotLoadedDynamicPluginInfo[],
    );

    const pendingPluginEntries = Array.from(this.allowedDynamicPluginNames.values())
      .filter(
        (pluginName) =>
          !this.isDynamicPluginLoaded(pluginName) && !this.isDynamicPluginFailed(pluginName),
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
      staticPlugins: this.staticPlugins,
      disabledStaticPluginNames: this.disabledStaticPluginNames,
      loadedDynamicPlugins: this.loadedDynamicPlugins,
      failedDynamicPlugins: this.failedDynamicPlugins,
      listeners: this.listeners,
    };
  }
}

type FlagsObject = { [key: string]: boolean };

type StaticPlugin = {
  name: string;
  extensions: LoadedExtension[];
};

type DynamicPluginManifest = Readonly<StandardConsolePluginManifest>;

type DynamicPluginMetadata = Omit<
  DynamicPluginManifest,
  'extensions' | 'loadScripts' | 'registrationMethod'
>;

type LoadedDynamicPlugin = {
  manifest: DynamicPluginManifest;
  processedExtensions: Readonly<LoadedExtension[]>;
  enabled: boolean;
  customInfo: CustomDynamicPluginInfo;
};

type FailedDynamicPlugin = {
  errorMessage: string;
  errorCause?: unknown;
};

type CustomDynamicPluginInfo = Partial<{
  /** If `true`, one or more Content Security Policy violations were detected for this plugin. */
  hasCSPViolations: boolean;
}>;

export type LoadedDynamicPluginInfo = {
  status: 'Loaded';
  pluginID: string;
  metadata: DynamicPluginMetadata;
  enabled: boolean;
} & CustomDynamicPluginInfo;

export type NotLoadedDynamicPluginInfo =
  | {
      status: 'Pending';
      pluginName: string;
    }
  | {
      status: 'Failed';
      pluginName: string;
      errorMessage: string;
      errorCause?: unknown;
    };

export type DynamicPluginInfo = LoadedDynamicPluginInfo | NotLoadedDynamicPluginInfo;

export const isLoadedDynamicPluginInfo = (i: DynamicPluginInfo): i is LoadedDynamicPluginInfo =>
  i.status === 'Loaded';

export const isNotLoadedDynamicPluginInfo = (
  i: DynamicPluginInfo,
): i is NotLoadedDynamicPluginInfo => i.status === 'Failed' || i.status === 'Pending';
