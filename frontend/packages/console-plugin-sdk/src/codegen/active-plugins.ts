/* eslint-env node */

import { Extension, Plugin, ActivePlugin } from '../typings';
import { PluginPackage } from './plugin-resolver';

/**
 * Dynamically load plugins for testing or reporting purposes.
 *
 * _Important: keep this in sync with `getActivePluginsModule` below._
 */
export const loadActivePlugins = (pluginPackages: PluginPackage[]) => {
  const activePlugins: ActivePlugin[] = [];

  for (const pkg of pluginPackages) {
    // eslint-disable-next-line
    const plugin = require(`${pkg.name}/${pkg.consolePlugin.entry}`).default as Plugin<Extension>;
    activePlugins.push({ name: pkg.name, extensions: plugin });
  }

  return activePlugins;
};

/**
 * Generate the `@console/active-plugins` virtual module source.
 */
export const getActivePluginsModule = (pluginPackages: PluginPackage[]) => {
  let output = `
    const activePlugins = [];
  `;

  for (const pkg of pluginPackages) {
    const pluginVar = `plugin_${pluginPackages.indexOf(pkg)}`;
    output = `
      ${output}
      const ${pluginVar} = require('${pkg.name}/${pkg.consolePlugin.entry}').default;
      activePlugins.push({ name: '${pkg.name}', extensions: ${pluginVar} });
    `;
  }

  output = `
    ${output}
    export default activePlugins;
  `;

  return output.replace(/^\s+/gm, '');
};
