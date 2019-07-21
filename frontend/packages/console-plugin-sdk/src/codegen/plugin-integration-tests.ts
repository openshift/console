import { resolve } from 'path';
import * as _ from 'lodash';
import {
  PluginPackage,
  filterActivePluginPackages,
  resolvePluginPackages,
} from './plugin-resolver';

const consoleIntegrationTestPrefix = '@console/internal-integration-tests';

const extractFullPath = (testPath: string, pluginPath: string) =>
  testPath.startsWith(consoleIntegrationTestPrefix)
    ? testPath.substring(`${consoleIntegrationTestPrefix}/`.length)
    : resolve(`${pluginPath}/${testPath}`);

/**
 * Return an object representing Protractor test suites collected from active plugins.
 */
export const getPluginIntegrationTestSuites = (
  pluginPackages: PluginPackage[] = resolvePluginPackages(
    process.cwd(),
    filterActivePluginPackages,
  ),
) => {
  const integrationTestSuites = (plugin: PluginPackage) =>
    plugin.consolePlugin.integrationTestSuites &&
    _.mapValues(
      plugin.consolePlugin.integrationTestSuites,
      (paths) => _.map(paths, (path) => extractFullPath(path, plugin._path)), // eslint-disable-line no-underscore-dangle
    );

  const testSuites = pluginPackages.reduce(
    (map, pkg) => Object.assign(map, integrationTestSuites(pkg)),
    {},
  );

  return testSuites;
};
