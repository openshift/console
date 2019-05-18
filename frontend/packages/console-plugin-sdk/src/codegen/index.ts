/* eslint-env node */

import * as path from 'path';
import * as readPkg from 'read-pkg';

export type Package = readPkg.NormalizedPackageJson;

export interface PluginPackage extends Package {
  consolePlugin: {
    entry: string;
  }
}

export function isValidPluginPackage(pkg: Package): pkg is PluginPackage {
  if (!(pkg as PluginPackage).consolePlugin) {
    return false;
  }

  const entry = (pkg as PluginPackage).consolePlugin.entry;
  return typeof entry === 'string' && entry.length > 0;
}

/**
 * Read package metadata and detect any plugins.
 *
 * @param packageFiles Paths to `package.json` files (all the monorepo packages).
 */
export function readPackages(packageFiles: string[]) {
  const pkgList: Package[] = packageFiles.map(file => readPkg.sync({ cwd: path.dirname(file), normalize: true }));

  return {
    appPackage: pkgList.find(pkg => pkg.name === '@console/app'),
    pluginPackages: pkgList.filter(isValidPluginPackage),
  };
}

/**
 * Resolve the list of active plugins.
 */
export function resolveActivePlugins(appPackage: Package, pluginPackages: PluginPackage[]) {
  return pluginPackages.filter(pkg => appPackage.dependencies[pkg.name] === pkg.version);
}

/**
 * Generate the "active plugins" module source.
 */
export function getActivePluginsModule(activePluginPackages: PluginPackage[]): string {
  let output = `
    const activePlugins = [];
  `;

  for (const pkg of activePluginPackages) {
    const importName = `plugin_${activePluginPackages.indexOf(pkg)}`;
    const importPath = `${pkg.name}/${pkg.consolePlugin.entry}`;
    output = `
      ${output}
      import ${importName} from '${importPath}';
      activePlugins.push(${importName});
    `;
  }

  output = `
    ${output}
    export default activePlugins;
  `;

  return output.replace(/^\s+/gm, '');
}
