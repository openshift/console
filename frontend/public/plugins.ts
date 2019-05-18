/* eslint-disable no-undef */

import { PluginList, ExtensionRegistry } from '@console/plugin-sdk';
export * from '@console/plugin-sdk';

// the '@console/active-plugins' module is generated during webpack build
const activePlugins = (process.env.NODE_ENV !== 'test')
  ? require('@console/active-plugins').default as PluginList
  : [];

export const registry = new ExtensionRegistry(activePlugins);

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`${activePlugins.length} plugins active`);
}
