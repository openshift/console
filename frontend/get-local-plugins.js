/* eslint-disable tsdoc/syntax */ // This file is written in JavaScript, so we use JSDoc here. TSDoc rules don't apply
// @ts-check
const { getLocalPluginsModuleData } = require('@console/plugin-sdk/src/codegen/local-plugins');

/**
 * Get the current Console local plugins virtual module information.
 *
 * This module is used by webpack `val-loader` which uses the resulting `code` as actual module source.
 *
 * @param {object} options
 * @param {import('@console/plugin-sdk/src/codegen/plugin-resolver').PluginPackage[]} options.pluginPackages
 * @param {import('webpack').LoaderContext<any>} loaderContext
 *
 * @returns {{code: string}} Generated module source code.
 */
const getLocalPlugins = ({ pluginPackages }, loaderContext) => {
  const {
    code,
    diagnostics: { errors, warnings },
    fileDependencies,
  } = getLocalPluginsModuleData(pluginPackages);

  if (errors.length > 0 || warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `Console local plugins virtual module code generated with ${errors.length} errors and ${warnings.length} warnings`,
    );
  }

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

module.exports = getLocalPlugins;
