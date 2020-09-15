/* eslint-disable no-console */

import { PluginStore } from '@console/plugin-sdk/src/store';
import { overrideSharedModules } from '../shared-modules';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { resolveEncodedCodeRefs } from '../coderefs/coderef-resolver';
import { remoteEntryFile } from '../constants';
import { RemoteEntryModule } from '../types';

type ConsolePluginData = {
  /** The manifest containing plugin metadata and extension declarations. */
  manifest: ConsolePluginManifestJSON;
  /** Indicates if `window.loadPluginEntry` callback has been fired for this plugin. */
  entryCallbackFired: boolean;
};

const pluginMap = new Map<string, ConsolePluginData>();

const getPluginID = (m: ConsolePluginManifestJSON) => `${m.name}@${m.version}`;

export const loadDynamicPlugin = (baseURL: string, manifest: ConsolePluginManifestJSON) => {
  const pluginID = getPluginID(manifest);
  console.info(`Loading plugin ${pluginID} from ${baseURL}`);

  const existingPluginData = Array.from(pluginMap.values()).find(
    (p) => p.manifest.name === manifest.name,
  );

  if (existingPluginData) {
    console.error(`Attempt to reload plugin ${getPluginID(existingPluginData.manifest)}`);
    return;
  }

  pluginMap.set(pluginID, { manifest, entryCallbackFired: false });

  const script = document.createElement('script');
  script.src = new URL(remoteEntryFile, baseURL).toString();
  script.async = true;
  script.onerror = (event) => {
    console.error(`Error while loading entry script for plugin ${pluginID}`, event);
  };

  document.head.appendChild(script);
};

export const registerPluginEntryCallback = (pluginStore: PluginStore) => {
  window.loadPluginEntry = (pluginID: string, entryModule: RemoteEntryModule) => {
    if (!pluginMap.has(pluginID)) {
      console.error(`Received callback for unknown plugin ${pluginID}`);
      return;
    }

    const pluginData = pluginMap.get(pluginID);

    if (pluginData.entryCallbackFired) {
      console.error(`Received callback for already loaded plugin ${pluginID}`);
      return;
    }

    pluginData.entryCallbackFired = true;

    try {
      overrideSharedModules(entryModule);
    } catch (error) {
      console.error(`Failed to override shared modules for plugin ${pluginID}`, error);
      return;
    }

    const resolvedExtensions = resolveEncodedCodeRefs(
      pluginData.manifest.extensions,
      entryModule,
      pluginID,
      () => pluginStore.setDynamicPluginEnabled(pluginID, false),
    );

    pluginStore.addDynamicPlugin(pluginID, pluginData.manifest, resolvedExtensions);
  };
};
