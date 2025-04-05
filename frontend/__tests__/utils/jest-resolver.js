/* eslint-disable tsdoc/syntax */ // This file is written in JavaScript, so we use JSDoc here. TSDoc rules don't apply

/**
 * See https://jestjs.io/docs/configuration#resolver-string
 *
 * TODO: determine whether this is still needed
 *
 * @param {string} request
 * @param {import('jest-resolve').ResolverOptions} options
 */
// eslint-disable-next-line no-undef
module.exports = (request, options) => {
  let packageFilter;
  if (request.startsWith('i18next')) {
    packageFilter = (pkg) => ({
      ...pkg,
      // Alter the value of `main` before resolving the package
      main: pkg.module || pkg.main,
    });
  }
  return options.defaultResolver(request, {
    ...options,
    packageFilter,
  });
};
