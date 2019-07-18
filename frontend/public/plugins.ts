/* eslint-disable no-undef */

import { ActivePlugin, PluginStore } from '@console/plugin-sdk';
export * from '@console/plugin-sdk'; // TODO(vojtech): remove once everyone uses the HOC

// The '@console/active-plugins' module is generated during webpack build,
// so using dynamic require() instead of the usual static import statement.
const activePlugins = (process.env.NODE_ENV !== 'test')
  ? require('@console/active-plugins').default as ActivePlugin[]
  : [];

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Active plugins: [${activePlugins.map(p => p.name).join(', ')}]`);
}

export const pluginStore = new PluginStore(activePlugins);

// TODO(vojtech): remove once everyone uses the HOC
export const registry = pluginStore.registry;

if (process.env.NODE_ENV !== 'production') {
  // Expose plugin store for debugging
  window.pluginStore = pluginStore;
}
