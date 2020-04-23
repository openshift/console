const defaultResolver = require('jest-resolve/build/defaultResolver').default;

// eslint-disable-next-line no-undef
module.exports = (request, options) => {
  let packageFilter;
  if (request.startsWith('i18next')) {
    packageFilter = (pkg) => ({
      ...pkg,
      main: pkg.module || pkg.main,
    });
  }
  return defaultResolver(request, {
    ...options,
    packageFilter,
  });
};
