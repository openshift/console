/* eslint-disable no-undef */

import { ActivePlugin, ExtensionRegistry } from '@console/plugin-sdk';
export * from '@console/plugin-sdk';

// the '@console/active-plugins' module is generated during webpack build
export const activePlugins = (process.env.NODE_ENV !== 'test')
  ? require('@console/active-plugins').default as ActivePlugin[]
  : [];

export const registry = new ExtensionRegistry(activePlugins);

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Active plugins: [${activePlugins.map(p => p.name).join(', ')}]`);
}
