/* eslint-env node */
const i18next = require('i18next');
const react = require.requireActual('react');
const reactI18next = require.requireActual('react-i18next');

module.exports = {
  ...reactI18next,
  useTranslation: () => ({ t: i18next.t }),
  withTranslation: () => (component) => (props) =>
    react.createElement(component, { ...props, t: i18next.t }),
};
