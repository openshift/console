import path from 'path';
import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const SDK_NODE_DIRS = [
  'packages/console-plugin-sdk/src/codegen',
  'packages/console-plugin-sdk/src/webpack',
  'packages/console-dynamic-plugin-sdk/scripts',
  'packages/console-dynamic-plugin-sdk/src/webpack',
] as const;

const PACKAGES_EXCLUDE = [
  'packages/eslint-plugin-console/**',
  ...SDK_NODE_DIRS.map((d) => `${d}/**`),
];

const CYPRESS_INTEGRATION_DIRS = [
  'packages/integration-tests',
  'packages/dev-console/integration-tests',
  'packages/knative-plugin/integration-tests',
  'packages/helm-plugin/integration-tests',
];

const CYPRESS_FILES = CYPRESS_INTEGRATION_DIRS.map((d) => `${d}/**/*.{js,jsx,ts,tsx}`);

export default defineConfig([
  globalIgnores([
    '.puppeteer/**',
    '.yarn/**',
    '__coverage__/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/generated/**',
    '**/*.min.js',
    'gui_test_screenshots/**',
    'public/lib/**',
    'Godeps/**',
    '@types/**',
    'dynamic-demo-plugin/**',
    'eslint.config.ts',
    '**/tsconfig.json',
    'e2e/package.json',
    'test-results/**',
    'yarn.lock',
    '.vscode/**',
    '**/.*',
    'e2e/**/testData/**',
  ]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  // ------------------------------------------------
  // Scope: Root frontend (non-packages, non-i18n-scripts, non-e2e)
  // ------------------------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx,json}'],
    ignores: ['packages/**', 'i18n-scripts/**', 'e2e/**'],
    extends: compat.config({
      extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:react/recommended',
        'plugin:console/json',
        'plugin:console/prettier',
        'plugin:console/testing-library-tests',
      ],
      env: {
        browser: true,
        es6: true,
        jest: true,
        node: true,
      },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2018,
        extraFileExtensions: ['.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      plugins: ['react', 'react-hooks', '@typescript-eslint', 'eslint-plugin-tsdoc', 'no-barrel-files'],
      rules: {
        camelcase: 'error',
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
        'no-unused-vars': 'off',
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
                importNamePattern: '^(?!Rh|createIcon)',
                message:
                  'Use RhMicron, RhUi, or RhStandard icon variants instead of Font Awesome icons.',
              },
            ],
          },
        ],
        'no-var': 'error',
        'object-shorthand': ['error', 'properties'],
        'prefer-const': ['error', { destructuring: 'all' }],
        'prefer-template': 'error',
        radix: 'error',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-fragments': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/no-string-refs': 'warn',
        'react/no-unknown-property': 'error',
        'react/prop-types': 'off',
        'react/self-closing-comp': ['error', { component: true, html: false }],
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'require-atomic-updates': 'off',
        'tsdoc/syntax': 'warn',
        'import/no-named-as-default-member': 'off',
        'import/named': 'off',
        'no-unsafe-optional-chaining': 'off',
        'no-import-assign': 'off',
        'no-constructor-return': 'off',
        'prefer-regex-literals': 'off',
        'no-restricted-exports': 'off',
        'no-barrel-files/no-barrel-files': 'error',
        'no-restricted-syntax': [
          'warn',
          {
            selector: "CallExpression[callee.name='useTranslation'][arguments.length=0]",
            message:
              "Pass the i18n namespace to useTranslation(). Example: useTranslation('public') instead of useTranslation().",
          },
        ],
      },
      settings: {
        'import/extensions': ['.js', '.jsx'],
        'import/resolver': { typescript: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
        react: { version: 'detect' },
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
    }),
  },

  // ------------------------------------------------
  // Scope: packages/ (react-typescript-prettier)
  // ------------------------------------------------
  {
    files: ['packages/**/*.{js,jsx,ts,tsx,json}'],
    ignores: PACKAGES_EXCLUDE,
    extends: compat.extends('plugin:console/react-typescript-prettier'),
  },

  // ------------------------------------------------
  // Scope: Cypress integration tests (overlay on packages config)
  // ------------------------------------------------
  {
    files: CYPRESS_FILES,
    extends: compat.extends('plugin:cypress/recommended'),
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-namespace': 'off',
      'no-redeclare': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-nesting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
    },
  },
  {
    files: [
      'packages/dev-console/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/helm-plugin/integration-tests/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'cypress/no-unnecessary-waiting': 'off',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', 'integration-tests/'],
        },
      },
    },
  },

  // ------------------------------------------------
  // Scope: SDK Node.js directories (node-typescript-prettier)
  // ------------------------------------------------
  {
    files: SDK_NODE_DIRS.map((dir) => `${dir}/**/*.{js,jsx,ts,tsx,json}`),
    extends: compat.extends('plugin:console/node-typescript-prettier'),
  },
  {
    files: [
      'packages/console-plugin-sdk/src/codegen/**/*.{js,ts}',
      'packages/console-plugin-sdk/src/webpack/**/*.{js,ts}',
    ],
    rules: { 'no-underscore-dangle': 'off' },
  },
  {
    files: ['packages/console-dynamic-plugin-sdk/scripts/**/*.{js,ts}'],
    rules: { 'no-console': 'off' },
  },

  // ------------------------------------------------
  // Scope: eslint-plugin-console (base + node + json + prettier)
  // ------------------------------------------------
  {
    files: ['packages/eslint-plugin-console/**/*.{js,jsx,ts,tsx,json}'],
    extends: compat.extends(
      'plugin:console/base',
      'plugin:console/node',
      'plugin:console/json',
      'plugin:console/prettier',
    ),
  },

  // ------------------------------------------------
  // Scope: i18n-scripts (node-typescript-prettier)
  // ------------------------------------------------
  {
    files: ['i18n-scripts/**/*.{js,jsx,ts,tsx,json}'],
    extends: compat.extends('plugin:console/node-typescript-prettier'),
  },
  {
    files: ['i18n-scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },

  // ------------------------------------------------
  // Scope: e2e (Playwright)
  // ------------------------------------------------
  {
    files: ['e2e/**/*.{js,jsx,ts,tsx,json}'],
    extends: compat.extends('plugin:console/playwright'),
  },
  {
    files: ['e2e/**/*.{js,ts}'],
    ignores: ['e2e/**/testData/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: path.join(import.meta.dirname, 'e2e'),
      },
    },
    rules: {
      'no-console': 'off',
      'no-empty-pattern': 'off',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'CallExpression[callee.property.name="waitFor"]',
          message:
            'Playwright actions (click, fill, check, clear) auto-wait for actionability. ' +
            'Do not call waitFor() before an action on the same locator. ' +
            'If this waitFor() is intentional (waiting for state without a subsequent action), ' +
            'add // eslint-disable-next-line no-restricted-syntax',
        },
      ],
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
  {
    files: ['e2e/setup/**/*.ts'],
    rules: {
      'playwright/expect-expect': 'off',
    },
  },
]);
