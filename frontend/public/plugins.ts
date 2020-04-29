import { Store } from 'redux';
import { RootState } from '@console/internal/redux';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { ActivePlugin } from '@console/plugin-sdk/src/typings';
import { initSubscriptionService } from '@console/plugin-sdk/src/subscribeToExtensions';
import { fetchPluginManifest } from '@console/dynamic-plugin-sdk/src/runtime/plugin-manifest';
import {
  loadDynamicPlugin,
  registerPluginEntryCallback,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-loader';

// The '@console/active-plugins' module is generated during a webpack build,
// so we use dynamic require() instead of the usual static import statement.
const activePlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('@console/active-plugins').default as ActivePlugin[])
    : [];

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Active plugins: [${activePlugins.map((p) => p.name).join(', ')}]`);
}

export const pluginStore = new PluginStore(activePlugins);
export const registry = pluginStore.registry;

export const initConsolePlugins = (reduxStore: Store<RootState>) => {
  initSubscriptionService(pluginStore, reduxStore);
  registerPluginEntryCallback(pluginStore);
};

if (process.env.NODE_ENV !== 'production') {
  // Expose Console plugin store for debugging
  window.pluginStore = pluginStore;

  // Expose function to load plugins directly from URLs
  window.loadPluginFromURL = async (baseURL: string) => {
    const manifest = await fetchPluginManifest(baseURL);
    loadDynamicPlugin(baseURL, manifest);
  };
}
