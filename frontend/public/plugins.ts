import { PluginStore } from '@console/plugin-sdk/src/store';
import { ActivePlugin } from '@console/plugin-sdk/src/typings';

// TODO(vojtech): legacy, remove along with `registry` export
export * from '@console/plugin-sdk/src/typings';

// The '@console/active-plugins' module is generated during a webpack build,
// so we use dynamic require() instead of the usual static import statement.
export const activePlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('@console/active-plugins').default as ActivePlugin[])
    : [];

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Active plugins: [${activePlugins.map((p) => p.name).join(', ')}]`);
}

export const pluginStore = new PluginStore(activePlugins);
export const registry = pluginStore.registry;

if (process.env.NODE_ENV !== 'production') {
  // Expose Console plugin store for debugging
  window.pluginStore = pluginStore;
}
