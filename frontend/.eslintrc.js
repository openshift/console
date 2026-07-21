module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:react/recommended',
    'plugin:console/json',
    'plugin:console/prettier',
    'plugin:console/testing-library-tests',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    extraFileExtensions: ['.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'eslint-plugin-tsdoc', 'no-barrel-files'],
  rules: {
    camelcase: [
      'error',
      { allow: ['UNSAFE_componentWillReceiveProps', 'UNSAFE_componentWillMount'] },
    ],
    'consistent-return': 'off',
    'consistent-this': ['warn', 'that'],
    curly: ['error', 'all'],
    'default-case': ['error'],
    'dot-notation': ['error'],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'guard-for-in': 'error',
    'import/no-duplicates': ['error'],
    'max-nested-callbacks': ['warn', 4],
    'no-alert': 'error',
    'no-caller': 'error',
    'no-console': 'error',
    'no-constant-condition': 'error',
    'no-debugger': 'error',
    'no-else-return': ['error'],
    'no-irregular-whitespace': ['error'],
    'no-prototype-builtins': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: 'React', args: 'after-used', caughtErrors: 'none' },
    ],
    '@typescript-eslint/no-use-before-define': 'error',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lodash-es',
            message: 'Use lodash instead. webpack is configured to use lodash-es automatically.',
          },
          {
            name: 'react',
            importNames: ['default', '*'],
            // Future ESM-only React versions will remove the default export,
            // and namespace imports may negatively impact tree-shaking
            message: 'Use named imports instead.',
          },
          {
            name: 'react',
            importNames: ['act'],
            // https://testing-library.com/docs/react-testing-library/api/#act
            message: "For consistency, import { act } from '@testing-library/react'",
          },
        ],
        patterns: [
          {
            group: ['@patternfly/react-icons'],
            importNamePattern: '^(?!Rh|createIcon)',
            message: 'Use RhMicron, RhUi, or RhStandard icon variants instead of Font Awesome icons.',
          },
        ],
      },
    ],
    'no-var': 'error',
    'object-shorthand': ['error', 'properties'],
    'prefer-const': ['error', { destructuring: 'all' }],
    'prefer-template': 'error',
    radix: 'error',
    'react/react-in-jsx-scope': 'off', // React 17 doesn't require this anymore
    'react/jsx-fragments': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/no-string-refs': 'warn',
    'react/no-unknown-property': 'error',
    'react/prop-types': 'off', // TODO: enable and fully specify component prop types
    'react/self-closing-comp': ['error', { component: true, html: false }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'require-atomic-updates': 'off',
    'tsdoc/syntax': 'warn',
    // Disable import rules with too many false positives in TypeScript
    'import/no-named-as-default-member': 'off',
    'import/named': 'off',
    // New rules from eslint:recommended v8 / updated plugins - disable for now, enable in follow-up PRs
    'no-unsafe-optional-chaining': 'off',
    'no-import-assign': 'off',
    'no-constructor-return': 'off',
    'prefer-regex-literals': 'off',
    'no-restricted-exports': 'off',
    'no-barrel-files/no-barrel-files': 'error',
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          "CallExpression[callee.name='useTranslation'][arguments.length=0]",
        message:
          'Pass the i18n namespace to useTranslation(). Example: useTranslation(\'public\') instead of useTranslation().',
      },
    ],
  },
  settings: {
    'import/extensions': ['.js', '.jsx'],
    'import/resolver': { typescript: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
    react: {
      version: 'detect',
    },
  },
  globals: {
    process: 'readonly',
    React: true,
    JSX: 'readonly',
    NodeJS: 'readonly',
    Subject: 'readonly',
    Diff: 'readonly',
    BlobPropertyBag: 'readonly',
    VoidFunction: 'readonly',
    RequestInit: 'readonly',
  },
};
