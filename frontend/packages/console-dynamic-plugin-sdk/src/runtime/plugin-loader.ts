/* eslint-disable no-console */

import { PluginStore } from '@console/plugin-sdk/src/store';
import { overrideSharedModules } from '../shared-modules';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { resolveEncodedCodeRefs } from '../coderefs/coderef-resolver';
import { remoteEntryFile } from '../constants';
import { RemoteEntryModule } from '../types';
import { resolveURL } from '../utils/url';

type ConsolePluginData = {
  /** The manifest containing plugin metadata and extension declarations. */
  manifest: ConsolePluginManifestJSON;
  /** Indicates if `window.loadPluginEntry` callback has been fired for this plugin. */
  entryCallbackFired: boolean;
};

const pluginMap = new Map<string, ConsolePluginData>();

export const scriptIDPrefix = 'console-plugin';

export const getPluginID = (m: ConsolePluginManifestJSON) => `${m.name}@${m.version}`;

export const getScriptElementID = (m: ConsolePluginManifestJSON) => `${scriptIDPrefix}-${m.name}`;

export const loadDynamicPlugin = (baseURL: string, manifest: ConsolePluginManifestJSON) => {
  const pluginID = getPluginID(manifest);
  console.info(`Loading plugin ${pluginID} from ${baseURL}`);

  const existingPluginData = Array.from(pluginMap.values()).find(
    (p) => p.manifest.name === manifest.name,
  );

  if (existingPluginData) {
    const existingPluginID = getPluginID(existingPluginData.manifest);
    console.error(`Attempt to reload plugin ${existingPluginID} with ${pluginID}`);
    return;
  }

  pluginMap.set(pluginID, { manifest, entryCallbackFired: false });

  const script = document.createElement('script');
  script.id = getScriptElementID(manifest);
  script.src = resolveURL(baseURL, remoteEntryFile, { trailingSlashInBaseURL: true });
  script.async = true;
  script.onerror = (event) => {
    console.error(`Error while loading entry script for plugin ${pluginID}`, event);
  };

  document.head.appendChild(script);
};

export const getPluginEntryCallback = (
  pluginStore: PluginStore,
  overrideSharedModulesCallback: typeof overrideSharedModules,
  resolveEncodedCodeRefsCallback: typeof resolveEncodedCodeRefs,
) => (pluginID: string, entryModule: RemoteEntryModule) => {
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
    overrideSharedModulesCallback(entryModule);
  } catch (error) {
    console.error(`Failed to override shared modules for plugin ${pluginID}`, error);
    return;
  }

  const resolvedExtensions = resolveEncodedCodeRefsCallback(
    pluginData.manifest.extensions,
    entryModule,
    pluginID,
    () => pluginStore.setDynamicPluginEnabled(pluginID, false),
  );

  pluginStore.addDynamicPlugin(pluginID, pluginData.manifest, resolvedExtensions);
};

export const registerPluginEntryCallback = (pluginStore: PluginStore) => {
  window.loadPluginEntry = getPluginEntryCallback(
    pluginStore,
    overrideSharedModules,
    resolveEncodedCodeRefs,
  );
};

export const getStateForTestPurposes = () => ({
  pluginMap,
});

export const resetStateAndEnvForTestPurposes = () => {
  pluginMap.clear();

  document.querySelectorAll(`[id^="${scriptIDPrefix}"]`).forEach((element) => {
    element.remove();
  });

  window.loadPluginEntry = undefined;
};
