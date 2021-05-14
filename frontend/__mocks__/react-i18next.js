/* eslint-env node */
const reactI18next = require.requireActual('react-i18next');
module.exports = {
  ...reactI18next,
  useTranslation: () => ({
    t: (key) => (key?.indexOf('~') !== -1 ? key.substring(key.indexOf('~') + 1) : key),
  }),
};
