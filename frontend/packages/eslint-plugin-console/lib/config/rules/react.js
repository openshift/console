module.exports = {
  // Forbid foreign propTypes; forbids using another component's prop types unless they are explicitly imported/exported
  'react/forbid-foreign-prop-types': 'error',

  // Restrict file extensions that may contain JSX
  // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md
  'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],

  // Enforce shorthand React fragment syntax
  'react/jsx-fragments': 'error',

  // Turning off because sometimes you just want to use 'this.state.foo' or 'this.props.children'
  'react/destructuring-assignment': 'off',

  // One JSX element Per line
  'react/jsx-one-expression-per-line': 'off',

  // Prop spreading is forbidden
  'react/jsx-props-no-spreading': 'off',

  // Declare only one React component per file
  'react/no-multi-comp': 'off',

  // (Deprecated) A form label must be associated with a control
  'jsx-a11y/label-has-for': 'off',

  // Enforce that a label tag has a text label and an associated control.
  'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],

  /* ------------------------ New Rules as of eslint-plugin-react v7.17.0 --------------------------

    TODO The following rules are disabled since they are new and cause failures. Need follow up.

  ------------------------------------------------------------------------------------------------*/

  //  Enforces where React component static properties should be positioned.
  'react/static-property-placement': 'off',

  // Enforce the state initialization style to be either in a constructor or with a class property
  'react/state-in-constructor': 'off',

  // Enforce curly braces or disallow unnecessary curly braces in JSX
  'react/jsx-curly-brace-presence': 'off',

  // Enforce component methods order (fixable)
  'react/sort-comp': 'off',

  // Disable prop-types related rules (TypeScript handles this)
  'react/no-unused-prop-types': 'off',
  'react/forbid-prop-types': 'off',

  /* ---- Rules new/changed in eslint-config-airbnb v19 / eslint-plugin-react v7.37 ---- */

  // Enforce function component definition style (new in airbnb v19)
  'react/function-component-definition': 'off',

  // Require defaultProps for non-required props (TypeScript handles this)
  'react/require-default-props': 'off',

  // Disallow useless JSX fragments (new in airbnb v19)
  'react/jsx-no-useless-fragment': 'off',

  // Prevent unstable nested components (new in react plugin)
  'react/no-unstable-nested-components': 'off',

  // Prevent creating context values in render (new in react plugin)
  'react/jsx-no-constructed-context-values': 'off',
};
