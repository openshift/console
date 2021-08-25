/* eslint-env node */
const react = require.requireActual('react');
const reactI18next = require.requireActual('react-i18next');

const t = (key) => (key?.includes('~') ? key.substring(key.indexOf('~') + 1) : key);

module.exports = {
  ...reactI18next,
  useTranslation: () => ({ t }),
  withTranslation: () => (Component) => (props) => react.createElement(Component, { ...props, t }),
};
