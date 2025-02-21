/* eslint-disable tsdoc/syntax */ // This file is written in JavaScript, so we use JSDoc here. TSDoc rules don't apply
// @ts-check
const { getActivePluginsModuleData } = require('@console/plugin-sdk/src/codegen/active-plugins');

/**
 * Get the current Console active plugins virtual module information.
 *
 * This module is executed by webpack `val-loader` which uses the resulting `code` as actual module source.
 *
 *
 * @param {object} options
 * @param {import('@console/plugin-sdk/src/codegen/plugin-resolver').PluginPackage[]} options.pluginPackages
 * @param {import('webpack').LoaderContext<any>} loaderContext
 *
 * @returns {{code: string}} Generated module source code.
 */
const getActivePlugins = ({ pluginPackages }, loaderContext) => {
  const {
    code,
    diagnostics: { errors, warnings },
    fileDependencies,
  } = getActivePluginsModuleData(pluginPackages);
  // eslint-disable-next-line no-console
  console.log(
    `Console active plugins virtual module code generated with ${errors.length} errors and ${warnings.length} warnings`,
  );

  errors.forEach((msg) => {
    loaderContext.emitError(new Error(msg));
  });

  warnings.forEach((msg) => {
    loaderContext.emitWarning(new Error(msg));
  });

  fileDependencies.forEach((file) => {
    loaderContext.addDependency(file);
  });

  return { code };
};

module.exports = getActivePlugins;
