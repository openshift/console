import { PluginStore } from '@console/plugin-sdk/src/store';
import { ActivePlugin } from '@console/plugin-sdk/src/typings';
import { loadPluginFromURL } from '@console/dynamic-plugin-sdk/src/runtime/plugin-loader';

// The '@console/active-plugins' module is generated during a webpack build,
// so we use dynamic require() instead of the usual static import statement.
const activePlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('@console/active-plugins').default as ActivePlugin[])
    : [];

export const pluginStore = new PluginStore(
  activePlugins,
  new Set(window.SERVER_FLAGS.consolePlugins),
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
