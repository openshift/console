module.exports = {
  // Forbid foreign propTypes; forbids using another component's prop types unless they are explicitly imported/exported
  'react/forbid-foreign-prop-types': 'error',

  // Restrict file extensions that may contain JSX
  // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md
  'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],

  // Turning off because sometimes you just want to use 'this.state.foo' or 'this.props.children'
  'react/destructuring-assignment': 'off',

  // One JSX element Per line
  'react/jsx-one-expression-per-line': 'off',

  // Prevent missing props validation in a React component definition
  // Off due to false positives in typescript
  'react/prop-types': 'off',
};
