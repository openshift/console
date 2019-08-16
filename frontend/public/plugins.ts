/* eslint-disable no-undef */
import { ExtensionRegistry } from '@console/plugin-sdk';
import { activePlugins } from './active-plugins';

export * from '@console/plugin-sdk';

export const registry = new ExtensionRegistry(activePlugins);

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Active plugins: [${activePlugins.map(p => p.name).join(', ')}]`);
}
