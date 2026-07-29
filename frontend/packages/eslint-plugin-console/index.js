module.exports = {
  rules: {},
  configs: {
    // When extending multiple configurations, add to the list following the order outlined below:

    // Core configs: choose one
    base: require('./lib/config/base'),
    react: require('./lib/config/react'),

    // TypeScript support: choose one
    typescriptParser: require('./lib/config/typescript-parser'),
    typescript: require('./lib/config/typescript'),

    // Augmenting configs: choose one or more
    jest: require('./lib/config/jest'),
    playwright: require('./lib/config/playwright'),

    // React Testing Library (test/spec files only). Also merged into `react-typescript-prettier`.
    'testing-library-tests': require('./lib/config/testing-library-tests'),

    node: require('./lib/config/node'),

    // Add JSON linting (optional)
    json: require('./lib/config/json'),

    // Prettier must go last (optional)
    prettier: require('./lib/config/prettier'),

    // ...or use the pre-composed configurations representing common code archetypes (choose one):

    // Common web preset: React, TypeScript, Prettier, Testing Library on tests
    'react-typescript-prettier': {
      extends: [
        'plugin:console/react',
        'plugin:console/typescript',
        // TODO enable when we stop using jest with jasmine types
        // 'plugin:console/jest',
        'plugin:console/json',
        'plugin:console/testing-library-tests',
        'plugin:console/prettier',
      ],

      rules: {
        // TODO fix for monorepo support
        'import/no-extraneous-dependencies': 'off',

        'consistent-return': 'off',
        'consistent-this': ['warn', 'that'],
        'max-nested-callbacks': ['warn', 4],
        'no-alert': 'error',
        'no-constant-condition': 'error',
        'no-underscore-dangle': 'off',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'lodash-es',
                message:
                  'Use lodash instead. The bundler is configured to use lodash-es automatically.',
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
                importNamePattern: '^(?!Rh|createIcon)',
                message:
                  'Use RhMicron, RhUi, or RhStandard icon variants instead of Font Awesome icons.',
              },
            ],
          },
        ],
        'object-shorthand': ['error', 'properties'],
        'prefer-const': ['error', { destructuring: 'all' }],
        'react/no-string-refs': 'warn',
        'react/self-closing-comp': ['error', { component: true, html: false }],
        'react-hooks/exhaustive-deps': 'warn',
        'react/no-unescaped-entities': 'off',
        'no-restricted-syntax': [
          'warn',
          {
            selector: "CallExpression[callee.name='useTranslation'][arguments.length=0]",
            message:
              "Pass the i18n namespace to useTranslation(). Example: useTranslation('public') instead of useTranslation().",
          },
        ],
      },
    },

    // Common Node.js preset: TypeScript, Prettier
    'node-typescript-prettier': {
      extends: [
        'plugin:console/base',
        'plugin:console/typescript',
        'plugin:console/node',
        // TODO enable when we stop using jest with jasmine types
        // 'plugin:console/jest',
        'plugin:console/json',
        'plugin:console/prettier',
      ],
      rules: {
        // TODO fix for monorepo support
        'import/no-extraneous-dependencies': 'off',
        // Allow invocation of require()
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  },
};
