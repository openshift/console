/* eslint-env node */

import * as path from 'path';
import * as readPkg from 'read-pkg';

export type Package = readPkg.NormalizedPackageJson;

export type PluginPackage = Package & {
  consolePlugin: {
    entry: string;
  }
};

/**
 * Return `true` if the given package represents a Console plugin.
 */
export const isPluginPackage = (pkg: Package): pkg is PluginPackage => {
  if (!(pkg as PluginPackage).consolePlugin) {
    return false;
  }

  const entry = (pkg as PluginPackage).consolePlugin.entry;
  return typeof entry === 'string' && !!entry;
};

/**
 * Read package metadata and detect any plugins.
 *
 * @param packageFiles Paths to `package.json` files (all the monorepo packages).
 */
export const readPackages = (packageFiles: string[]) => {
  const pkgList: Package[] = packageFiles.map(file => readPkg.sync({ cwd: path.dirname(file), normalize: true }));

  return {
    appPackage: pkgList.find(pkg => pkg.name === '@console/app'),
    pluginPackages: pkgList.filter(isPluginPackage),
  };
};

/**
 * Get the list of plugins to be used for the build.
 */
export const getActivePluginPackages = (appPackage: Package, pluginPackages: PluginPackage[]) => {
  return pluginPackages.filter(pkg => appPackage.dependencies[pkg.name] === pkg.version);
};

/**
 * Generate the `@console/active-plugins` module source.
 */
export const getActivePluginsModule = (pluginPackages: PluginPackage[]) => {
  let output = `
    const activePlugins = [];
  `;

  for (const pkg of pluginPackages) {
    const importName = `plugin_${pluginPackages.indexOf(pkg)}`;
    output = `
      ${output}
      import ${importName} from '${pkg.name}/${pkg.consolePlugin.entry}';
      activePlugins.push({ name: '${pkg.name}', extensions: ${importName} });
    `;
  }

  output = `
    ${output}
    export default activePlugins;
  `;

  return output.replace(/^\s+/gm, '');
};
