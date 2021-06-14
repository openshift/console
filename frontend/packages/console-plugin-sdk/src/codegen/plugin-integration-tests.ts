import * as path from 'path';
import * as glob from 'glob';
import * as _ from 'lodash';
import { PluginPackage } from './plugin-resolver';

/**
 * Return Protractor `suites` object for the given plugin package.
 */
export const getTestSuitesForPluginPackage = (
  pkg: PluginPackage,
  protractorConfDir: string,
): TestSuitesObject => {
  return _.mapValues(pkg.consolePlugin.integrationTestSuites || {}, (testPathGlobs) => {
    const testFilePaths = _.flatten(
      testPathGlobs.map((pathGlob) => glob.sync(pathGlob, { cwd: pkg._path, absolute: true })),
    );
    return testFilePaths.map((filePath) => path.relative(protractorConfDir, filePath));
  });
};

/**
 * Merge `source` into `target` and return the resulting object.
 */
export const mergeTestSuites = (
  target: TestSuitesObject,
  source: TestSuitesObject,
): TestSuitesObject => {
  const result = Object.assign({}, target);
  _.forEach(source, (tests, suiteName) => {
    if (!result[suiteName]) {
      result[suiteName] = tests;
    } else {
      result[suiteName] = [...result[suiteName], ...tests];
    }
  });
  return _.mapValues(result, _.uniq);
};

/**
 * Accumulate plugin related `suites` objects into a single object.
 */
export const reducePluginTestSuites = (
  pluginPackages: PluginPackage[],
  protractorConfDir: string,
  mapTests: (tests: string[]) => string[] = _.identity,
): TestSuitesObject => {
  return pluginPackages
    .map((pkg) => getTestSuitesForPluginPackage(pkg, protractorConfDir))
    .map((obj) => _.mapValues(obj, mapTests))
    .reduce(mergeTestSuites, {});
};

type TestSuitesObject = { [suiteName: string]: string[] };
