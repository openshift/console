module.exports = {
  // Require i18n namespace argument for useTranslation()
  'no-restricted-syntax': [
    'warn',
    {
      selector: "CallExpression[callee.name='useTranslation'][arguments.length=0]",
      message:
        "Pass the i18n namespace to useTranslation(). Example: useTranslation('public') instead of useTranslation().",
    },
  ],

  // Restrict certain imports (lodash-es, React default/act, Font Awesome PF icons)
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'lodash-es',
          message: 'Use lodash instead. The bundler is configured to use lodash-es automatically.',
        },
        {
          name: 'react',
          importNames: ['default', '*'],
          message: 'Use named imports instead.',
        },
        {
          name: 'react',
          importNames: ['act'],
          message: "For consistency, import { act } from '@testing-library/react'",
        },
      ],
      patterns: [
        {
          group: ['@patternfly/react-icons'],
          importNamePattern:
            '^(?!Rh|createIcon|GitAltIcon|TerminalIcon|GithubIcon|GitlabIcon|BitbucketIcon)',
          message: 'Use RhMicron, RhUi, or RhStandard icon variants instead of Font Awesome icons.',
        },
      ],
    },
  ],

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

  // Disallow usage of string refs
  'react/no-string-refs': 'warn',

  // Enforce self-closing for components but not HTML elements
  'react/self-closing-comp': ['error', { component: true, html: false }],

  // Disallow unescaped entities in JSX
  'react/no-unescaped-entities': 'off',

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
