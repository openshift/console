/* eslint-env node */

import * as path from 'path';
import * as readPkg from 'read-pkg';

type Package = readPkg.NormalizedPackageJson;

interface PluginPackage extends Package {
  consolePlugin: {
    entry: string;
  }
}

function isValidPluginPackage(pkg: Package): pkg is PluginPackage {
  return (pkg as PluginPackage).consolePlugin && typeof (pkg as PluginPackage).consolePlugin.entry === 'string';
}

function readPackages(packageFiles: string[]) {
  const pkgList: Package[] = packageFiles.map(file => readPkg.sync({ cwd: path.dirname(file), normalize: true }));

  return {
    appPackage: pkgList.find(pkg => pkg.name === '@console/app'),
    pluginPackages: pkgList.filter(isValidPluginPackage),
  };
}

/**
 * Generate the "active plugins" module source.
 *
 * @param packageFiles Paths to `package.json` files (all the monorepo packages).
 */
export function getActivePluginsModule(packageFiles: string[]): string {
  const { appPackage, pluginPackages } = readPackages(packageFiles);
  let output = `
    const activePlugins = [];
  `;

  if (appPackage) {
    for (const depName of Object.keys(appPackage.dependencies)) {
      const depVersion = appPackage.dependencies[depName];
      const foundPluginPackage = pluginPackages.find(pkg => pkg.name === depName && pkg.version === depVersion);

      if (foundPluginPackage) {
        const importName = `plugin_${pluginPackages.indexOf(foundPluginPackage)}`;
        const importPath = `${foundPluginPackage.name}/${foundPluginPackage.consolePlugin.entry}`;
        output = `
          ${output}
          import ${importName} from '${importPath}';
          activePlugins.push(${importName});
        `;
      }
    }
  }

  output = `
    ${output}
    export default activePlugins;
  `;

  return output.replace(/^\s+/gm, '');
}
