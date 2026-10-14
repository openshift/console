import * as path from 'path';
import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import * as js from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';

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
];

const REPO_SCRIPTS = [
  ...SDK_NODE_DIRS,
  'scripts',
  'i18n-scripts',
]

const PACKAGES_EXCLUDE = [
  'packages/eslint-plugin-console/**',
  ...SDK_NODE_DIRS.map((d) => `${d}/**`),
];

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
    // Standalone service worker copied verbatim by the build; not part of the module graph.
    'public/load-test.sw.js',
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
  // Scope: repo scripts (node-typescript-prettier)
  // ------------------------------------------------
  {
    files: ['*.{js,jsx,ts,tsx,json}', ...REPO_SCRIPTS.map((dir) => `${dir}/**/*.{js,jsx,ts,tsx,json}`)],
    extends: compat.extends('plugin:console/node-typescript-prettier'),
    rules: {
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
