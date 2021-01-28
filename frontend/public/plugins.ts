import { Store } from 'redux';
import * as _ from 'lodash';
import { RootState } from '@console/internal/redux';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { ActivePlugin } from '@console/plugin-sdk/src/typings';
import { initSubscriptionService } from '@console/plugin-sdk/src/api/subscribeToExtensions';
import { fetchPluginManifest } from '@console/dynamic-plugin-sdk/src/runtime/plugin-manifest';
import {
  getPluginID,
  loadDynamicPlugin,
  registerPluginEntryCallback,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-loader';

// The '@console/active-plugins' module is generated during a webpack build,
// so we use dynamic require() instead of the usual static import statement.
const activePlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('@console/active-plugins').default as ActivePlugin[])
    : [];

export const pluginStore = new PluginStore(activePlugins);
export const registry = pluginStore.registry;

export const initConsolePlugins = _.once((reduxStore: Store<RootState>) => {
  initSubscriptionService(pluginStore, reduxStore);
  registerPluginEntryCallback(pluginStore);
});

const loadPluginFromURL = async (baseURL: string) => {
  const manifest = await fetchPluginManifest(baseURL);
  loadDynamicPlugin(baseURL, manifest);
  return getPluginID(manifest);
};

// Load all dynamic plugins which are currently enabled on the cluster
Promise.all(
  window.SERVER_FLAGS.consolePlugins.map((pluginName) =>
    loadPluginFromURL(`${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}`).then(
      (pluginID) => {
        pluginStore.setDynamicPluginEnabled(pluginID, true);
      },
    ),
  ),
);

if (process.env.NODE_ENV !== 'production') {
  // Expose Console plugin store for debugging
  window.pluginStore = pluginStore;

  // Expose function to load dynamic plugins directly from URLs
  window.loadPluginFromURL = loadPluginFromURL;
}

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Static plugins: [${activePlugins.map((p) => p.name).join(', ')}]`);
  // eslint-disable-next-line no-console
  console.info(`Dynamic plugins: [${window.SERVER_FLAGS.consolePlugins.join(', ')}]`);
}
