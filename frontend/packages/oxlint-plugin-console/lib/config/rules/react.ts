import type { OxlintConfig } from 'oxlint';

export default {
  // Require i18n namespace argument for useTranslation()
  'eslint-js/no-restricted-syntax': [
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
        {
          group: ['use-sync-external-store', 'use-sync-external-store/shim'],
          importNames: ['useSyncExternalStore'],
          message:
            "Use the useSyncExternalStore shim from 'react' instead of importing the polyfill.",
        },
      ],
    },
  ],

  // Forbid foreign propTypes; forbids using another component's prop types unless they are explicitly imported/exported
  'react-js/forbid-foreign-prop-types': 'error',

  // Restrict file extensions that may contain JSX
  // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md
  'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],

  // Enforce shorthand React fragment syntax
  'react/jsx-fragments': 'error',

  // Prop spreading is forbidden
  'react/jsx-props-no-spreading': 'off',

  // Declare only one React component per file
  'react/no-multi-comp': 'off',

  // Enforce that a label tag has a text label and an associated control.
  'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],

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

  // Disallow useless JSX fragments (new in airbnb v19)
  'react/jsx-no-useless-fragment': 'off',

  // Prevent unstable nested components (new in react plugin)
  'react/no-unstable-nested-components': 'off',

  // Prevent creating context values in render (new in react plugin)
  'react/jsx-no-constructed-context-values': 'off',

  // React 17+ automatic JSX runtime: formerly disabled via the *.tsx
  // override in lib/config/react.ts
  'react/react-in-jsx-scope': 'off',
} satisfies OxlintConfig['rules'];
