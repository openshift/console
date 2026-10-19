import * as path from 'path';
import { FlatCompat } from '@eslint/eslintrc';
import * as js from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';
import { defineConfig, globalIgnores } from 'eslint/config';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const REPO_TOOLING = [
  'packages/console-plugin-sdk/src/codegen',
  'packages/console-plugin-sdk/src/webpack',
  'packages/console-dynamic-plugin-sdk/scripts',
  'packages/console-dynamic-plugin-sdk/src/webpack',
  'packages/eslint-plugin-console/**',
  'scripts',
  'i18n-scripts',
];

const config = defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/generated/**',
    '**/node_modules/**',
    '.vscode/**',
    '.yarn/**',
    '__coverage__/**',
    'test-results/**',
    'yarn.lock',
  ]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  // frontend code
  {
    files: ['public/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
    ignores: REPO_TOOLING.map((dir) => `${dir}/**`),
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

  // JSON files (seperate to avoid type-aware linting JSON files, which is broken)
  {
    files: ['public/**/*.json', 'packages/**/*.json', 'e2e/**/*.json'],
    extends: compat.extends('plugin:console/json'),
  },

  // repo tooling
  {
    files: ['*.{ts,tsx}', ...REPO_TOOLING.map((dir) => `${dir}/**/*.{ts,tsx}`)],
    extends: compat.extends('plugin:console/node-typescript-prettier'),
  },

  // e2e
  {
    files: ['e2e/**/*.{ts,tsx}'],
    ignores: ['e2e/**/testData/**'],
    extends: compat.extends('plugin:console/prettier', 'plugin:console/playwright'),
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: path.join(import.meta.dirname, 'e2e'),
      },
    },
  },
]);

export default config;
