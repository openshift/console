/* eslint-disable no-console */

import * as _ from 'lodash';
import * as semver from 'semver';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { getRandomChars } from '@console/shared/src/utils/utils';
import {
  AnyConsolePluginManifest,
  StandardConsolePluginManifest,
  isStandardPluginManifest,
} from '../build-types';
import { resolveEncodedCodeRefs } from '../coderefs/coderef-resolver';
import { initSharedPluginModules } from '../shared-modules-init';
import { RemoteEntryModule } from '../types';
import { ErrorWithCause } from '../utils/error/custom-error';
import { settleAllPromises } from '../utils/promise';
import { resolveURL } from '../utils/url';
import { resolvePluginDependencies } from './plugin-dependencies';
import { fetchPluginManifest } from './plugin-manifest';
import { getPluginID } from './plugin-utils';

type ConsolePluginData = {
  /** The manifest containing plugin metadata and extension declarations. */
  manifest: StandardConsolePluginManifest;
  /** Indicates if `window.loadPluginEntry` callback has been fired for this plugin. */
  entryCallbackFired: boolean;
};

const pluginMap = new Map<string, ConsolePluginData>();

export const getScriptElementID = (pluginName: string, scriptName: string) =>
  `${pluginName}/${scriptName}`;

const injectScriptElement = (url: string, id: string) =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');

    script.async = true;
    script.src = url;
    script.id = id;

    script.onload = () => {
      resolve();
    };

    script.onerror = (event) => {
      reject(event);
    };

    document.head.appendChild(script);
  });

export const loadDynamicPlugin = (manifest: StandardConsolePluginManifest) =>
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

    if (manifest.registrationMethod !== 'callback') {
      reject(new Error(`Plugin ${pluginID} does not use callback registration method`));
      return;
    }

    pluginMap.set(pluginID, {
      manifest,
      entryCallbackFired: false,
    });

    console.info(`Loading scripts of plugin ${pluginID}`);

    // eslint-disable-next-line promise/catch-or-return
    settleAllPromises(
      manifest.loadScripts.map((scriptName) => {
        const scriptID = getScriptElementID(manifest.name, scriptName);

        const scriptURL = resolveURL(manifest.baseURL, scriptName, (url) => {
          url.search = `?cacheBuster=${getRandomChars()}`;
          return url;
        });

        console.info(`Loading plugin script from ${scriptURL}`);

        return injectScriptElement(scriptURL, scriptID);
      }),
    ).then(([, rejectedReasons]) => {
      if (rejectedReasons.length > 0) {
        reject(
          new ErrorWithCause(`Detected errors while loading plugin entry scripts`, rejectedReasons),
        );
        return;
      }

      if (!pluginMap.get(pluginID).entryCallbackFired) {
        reject(new Error(`Scripts of plugin ${pluginID} loaded without entry callback`));
        return;
      }

      resolve(pluginID);
    });
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

export const adaptPluginManifest = (
  manifest: AnyConsolePluginManifest,
  baseURL: string,
): StandardConsolePluginManifest => {
  if (isStandardPluginManifest(manifest)) {
    return manifest;
  }

  const {
    name,
    version,
    extensions,
    dependencies,
    displayName,
    description,
    disableStaticPlugins,
  } = manifest;

  return {
    name,
    version,
    extensions,
    dependencies,
    customProperties: { console: { displayName, description, disableStaticPlugins } },
    baseURL,
    loadScripts: ['plugin-entry.js'],
    registrationMethod: 'callback',
  };
};

export const loadAndEnablePlugin = async (
  pluginName: string,
  pluginStore: PluginStore,
  onError: (errorMessage: string, errorCause?: unknown) => void = _.noop,
) => {
  const baseURL = `${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}/`;
  let manifest: StandardConsolePluginManifest;

  try {
    manifest = adaptPluginManifest(await fetchPluginManifest(baseURL), baseURL);
  } catch (e) {
    onError(`Failed to get a valid plugin manifest from ${baseURL}`, e);
    return;
  }

  try {
    await resolvePluginDependencies(
      manifest,
      semver.valid(window.SERVER_FLAGS.releaseVersion),
      pluginStore.getAllowedDynamicPluginNames(),
    );
  } catch (e) {
    onError(`Failed to resolve dependencies of plugin ${pluginName}`, e);
    return;
  }

  try {
    await loadDynamicPlugin(manifest);
  } catch (e) {
    onError(`Failed to load scripts of plugin ${pluginName}`, e);
    return;
  }

  pluginStore.setDynamicPluginEnabled(getPluginID(manifest), true);
};

export const getStateForTestPurposes = () => ({
  pluginMap,
});

export const resetStateAndEnvForTestPurposes = () => {
  pluginMap.clear();

  Array.from(document.scripts).forEach((element) => {
    element.remove();
  });

  window.loadPluginEntry = undefined;
};
