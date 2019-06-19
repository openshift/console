/* eslint-env node */

import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as readPkg from 'read-pkg';

// the name of Console application package
const consoleAppName = '@console/app';

// glob that matches all the monorepo packages
const consolePkgGlob = 'packages/*/package.json';

/**
 * Return `true` if the given package represents a Console plugin.
 */
export const isPluginPackage = (pkg: Package): pkg is PluginPackage => {
  if (!(pkg as PluginPackage).consolePlugin) {
    return false;
  }

  const { entry } = (pkg as PluginPackage).consolePlugin;
  return typeof entry === 'string' && !!entry;
};

/**
 * Read package metadata and detect any plugins.
 */
export const readPackages = (packageFiles: string[]) => {
  const pkgList: Package[] = packageFiles.map((file) =>
    readPkg.sync({
      cwd: path.dirname(file),
      normalize: true,
    }),
  );

  return {
    appPackage: pkgList.find((pkg) => pkg.name === consoleAppName),
    pluginPackages: pkgList.filter(isPluginPackage),
  };
};

export const filterActivePluginPackages: PluginPackageFilter = (appPackage, pluginPackages) => {
  // include dependencies of the appPackage or the appPackage itself
  const list = pluginPackages.filter(
    (pkg) => appPackage === pkg || appPackage.dependencies[pkg.name] === pkg.version,
  );

  // if appPackage is in the list, make sure it's the first element
  return _.sortBy(list, (pkg) => (appPackage === pkg ? 0 : 1));
};

/**
 * Resolve Console plugin packages using the provided filter.
 */
export const resolvePluginPackages = (
  monorepoRootDir: string = process.cwd(),
  pluginFilter: PluginPackageFilter = filterActivePluginPackages,
) => {
  const packageFiles = glob.sync(consolePkgGlob, { cwd: monorepoRootDir, absolute: true });
  const { appPackage, pluginPackages } = readPackages(packageFiles);
  return appPackage ? pluginFilter(appPackage, pluginPackages) : [];
};

export type Package = readPkg.NormalizedPackageJson;

export type PluginPackage = Package & {
  consolePlugin: {
    entry: string;
  };
};

type PluginPackageFilter = (
  appPackage: Package,
  pluginPackages: PluginPackage[],
) => PluginPackage[];
