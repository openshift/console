import * as path from 'path';
import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import * as js from '@eslint/js';
import * as globals from 'globals';
// TODO: change moduleResolution to "bundler"
// @ts-expect-error types not resolvable under moduleResolution "node"
import * as tsParser from '@typescript-eslint/parser';
import * as tsPlugin from '@typescript-eslint/eslint-plugin';

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

const config = defineConfig([
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
    'scripts/**',
  ]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  // ------------------------------------------------
  // Scope: public/ + packages/ (react-typescript-prettier)
  // ------------------------------------------------
  {
    files: ['public/**/*.{js,jsx,ts,tsx,json}', 'packages/**/*.{js,jsx,ts,tsx,json}'],
    ignores: PACKAGES_EXCLUDE,
    extends: compat.extends('plugin:console/react-typescript-prettier'),
    languageOptions: {
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
    },
  },
  {
    files: ['public/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    ignores: PACKAGES_EXCLUDE,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^React$',
          args: 'after-used',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],
    },
  },
  // TSDoc linting for public/ TypeScript files
  {
    files: ['public/**/*.{ts,tsx}'],
    extends: compat.config({
      plugins: ['eslint-plugin-tsdoc'],
      rules: { 'tsdoc/syntax': 'warn' },
    }),
  },
  // Use TS parser and plugin for .js/.jsx in public/ (matches old config behavior)
  {
    files: ['public/**/*.{js,jsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
  },

  // Rules that are broken or not relevant in non-typed JavaScript
  {
    files: ['public/**/*.{js,jsx}'],
    rules: {
      'react/prop-types': 'off',
      'import/no-unresolved': 'off',
    },
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
      '@typescript-eslint/no-namespace': 'off',
      'no-redeclare': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-nesting': 'off',
      'cypress/unsafe-to-chain-command': 'off',
      'max-nested-callbacks': 'off',
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
    ignores: ['e2e/**/testData/**'],
    extends: compat.extends(
      'plugin:console/prettier',
      'plugin:console/playwright'
    ),
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: path.join(import.meta.dirname, 'e2e'),
      },
    },
  },
  {
    files: ['e2e/setup/**/*.ts'],
    rules: {
      'playwright/expect-expect': 'off',
    },
  },
]);

export default config;
