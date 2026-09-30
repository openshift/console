const i18next = require('i18next');
const react = jest.requireActual('react');
const reactI18next = jest.requireActual('react-i18next');

const resolveTransChildren = (node, key?) => {
  if (Array.isArray(node)) {
    return node.map(resolveTransChildren);
  }
  if (react.isValidElement(node)) {
    return react.cloneElement(node, { key }, resolveTransChildren(node.props.children));
  }
  return node && typeof node === 'object' ? Object.values(node).join('') : node;
};

module.exports = {
  ...reactI18next,
  useTranslation: () => ({ t: i18next.t }),
  withTranslation: () => (component) => (props) =>
    react.createElement(component, { ...props, t: i18next.t }),
  Trans: (props) =>
    props.i18nKey
      ? react.createElement(reactI18next.Trans, props)
      : react.createElement(react.Fragment, null, resolveTransChildren(props.children)),
};
