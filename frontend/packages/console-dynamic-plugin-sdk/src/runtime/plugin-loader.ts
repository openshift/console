/* eslint-disable no-console */

import * as _ from 'lodash';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { resolveEncodedCodeRefs } from '../coderefs/coderef-resolver';
import { remoteEntryFile } from '../constants';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { initSharedPluginModules } from '../shared-modules-init';
import { RemoteEntryModule } from '../types';
import { resolveURL } from '../utils/url';
import { resolvePluginDependencies } from './plugin-dependencies';
import { fetchPluginManifest } from './plugin-manifest';
import { getPluginID } from './plugin-utils';

type ConsolePluginData = {
  /** The manifest containing plugin metadata and extension declarations. */
  manifest: ConsolePluginManifestJSON;
  /** Indicates if `window.loadPluginEntry` callback has been fired for this plugin. */
  entryCallbackFired: boolean;
};

const pluginMap = new Map<string, ConsolePluginData>();

export const scriptIDPrefix = 'console-plugin';

export const getScriptElementID = (m: ConsolePluginManifestJSON) => `${scriptIDPrefix}-${m.name}`;

export const loadDynamicPlugin = (baseURL: string, manifest: ConsolePluginManifestJSON) =>
  new Promise<string>((resolve, reject) => {
    const pluginID = getPluginID(manifest);

    const existingPluginData = Array.from(pluginMap.values()).find(
      (p) => p.manifest.name === manifest.name,
    );

    if (existingPluginData) {
      const existingPluginID = getPluginID(existingPluginData.manifest);
      reject(new Error(`Attempt to reload plugin ${existingPluginID} with ${pluginID}`));
      return;
    }

    pluginMap.set(pluginID, {
      manifest,
      entryCallbackFired: false,
    });

    const script = document.createElement('script');
    script.id = getScriptElementID(manifest);
    script.src = resolveURL(baseURL, remoteEntryFile);
    script.async = true;

    script.onload = () => {
      if (pluginMap.get(pluginID).entryCallbackFired) {
        resolve(pluginID);
      } else {
        reject(new Error(`Entry script for plugin ${pluginID} loaded without callback`));
      }
    };

    script.onerror = (event) => {
      console.error('Plugin loader received an error:', event);
      reject(new Error(`Error while loading entry script for plugin ${pluginID}`));
    };

    console.info(`Loading entry script for plugin ${pluginID} from ${script.src}`);
    document.head.appendChild(script);
  });

export const getPluginEntryCallback = (
  pluginStore: PluginStore,
  initSharedPluginModulesCallback: typeof initSharedPluginModules,
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
    initSharedPluginModulesCallback(entryModule);
  } catch (error) {
    console.error(`Failed to initialize shared modules for plugin ${pluginID}`, error);
    return;
  }

  const resolvedExtensions = resolveEncodedCodeRefsCallback(
    pluginData.manifest.extensions,
    entryModule,
    pluginID,
    () => {
      console.error(`Code reference resolution failed for plugin ${pluginID}`);
      pluginStore.setDynamicPluginEnabled(pluginID, false);
    },
  );

  pluginStore.addDynamicPlugin(pluginID, pluginData.manifest, resolvedExtensions);
};

export const registerPluginEntryCallback = (pluginStore: PluginStore) => {
  window.loadPluginEntry = getPluginEntryCallback(
    pluginStore,
    initSharedPluginModules,
    resolveEncodedCodeRefs,
  );
};

export const loadAndEnablePlugin = async (
  pluginName: string,
  pluginStore: PluginStore,
  onError: VoidFunction = _.noop,
) => {
  const url = `${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}/`;

  try {
    const manifest = await fetchPluginManifest(url);

    await resolvePluginDependencies(
      manifest,
      pluginStore.getAllowedDynamicPluginNames(),
      window.SERVER_FLAGS.releaseVersion,
    );

    const pluginID = await loadDynamicPlugin(url, manifest);
    pluginStore.setDynamicPluginEnabled(pluginID, true);
  } catch (e) {
    console.error(`Error while loading plugin ${pluginName} from ${url}`, e);
    onError();
  }
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
