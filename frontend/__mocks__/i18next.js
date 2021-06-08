/* eslint-env node */
const dependency = require.requireActual('i18next');
module.exports = {
  ...dependency,
  default: {
    ...dependency.default,
    use() {
      return this;
    },
    init: () => Promise.resolve(),
    t: (key) => (key?.indexOf('~') !== -1 ? key.substring(key.indexOf('~') + 1) : key),
  },
};
