const React = require('react');

function Linkify(props) {
  const Component = props.as || props.tagName || 'span';
  const children = props.children;
  return React.createElement(Component, { key: '__linkify-wrapper' }, children);
}

module.exports = Linkify;
module.exports.default = Linkify;
