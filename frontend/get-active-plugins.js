/**
 * Get the current Console active plugins virtual module information.
 *
 * This module is executed by webpack `val-loader` which uses the resulting `code` as actual module source.
 *
 *
 * @param {object} options
 * @param {GetModuleData} options.getModuleData
 * @param {import('webpack').LoaderContext<any>} loaderContext
 */

module.exports = ({ getModuleData }, loaderContext) => {
  const {
    code,
    diagnostics: { errors, warnings },
    fileDependencies,
  } = getModuleData();
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