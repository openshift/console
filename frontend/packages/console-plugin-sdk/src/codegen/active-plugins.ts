/* eslint-env node */

import { Extension, Plugin, ActivePlugin } from '../typings';
import { PluginPackage } from './plugin-resolver';

/**
 * Dynamically load plugins for testing or reporting purposes.
 */
export const loadActivePlugins = (pluginPackages: PluginPackage[]) => {
  const activePlugins: ActivePlugin[] = [];

  for (const pkg of pluginPackages) {
    // eslint-disable-next-line
    const plugin = require(`${pkg.name}/${pkg.consolePlugin.entry}`).default as Plugin<Extension<any>>;
    activePlugins.push({ name: pkg.name, extensions: plugin });
  }

  return activePlugins;
};
