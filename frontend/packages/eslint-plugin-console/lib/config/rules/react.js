module.exports = {
  // Require i18n namespace argument for useTranslation()
  'no-restricted-syntax': [
    'error',
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
        {
          group: ['@patternfly/*/dist/js/**', '@patternfly/*/dist/cjs/**'],
          message: 'Import from the package index instead of the CJS dist path.',
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

  // Conflicts with sort-class-members/sort-class-members
  'react/sort-comp': 'off',

  // Disable prop-types related rules (TypeScript handles this)
  'react/no-unused-prop-types': 'off',
  'react/forbid-prop-types': 'off',

  // Disallow usage of string refs
  'react/no-string-refs': 'error',

  // Enforce self-closing for components but not HTML elements
  'react/self-closing-comp': ['error', { component: true, html: false }],

  // Disallow unescaped entities in JSX
  'react/no-unescaped-entities': 'off',

  // Enforce consistent function component definitions (arrow functions)
  'react/function-component-definition': [
    'error',
    { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
  ],

  // Require defaultProps for non-required props (deprecated in React 17)
  'react/require-default-props': 'off',

  // Disallow useless JSX fragments (new in airbnb v19)
  'react/jsx-no-useless-fragment': 'off',

  // Prevent unstable nested components (new in react plugin)
  'react/no-unstable-nested-components': 'off',

  // Prevent creating context values in render (new in react plugin)
  'react/jsx-no-constructed-context-values': 'off',
};
