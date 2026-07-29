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

  // TODO: Rules disabled here were never enforced in public/. Remove entries
  // incrementally to align public/ with the stricter packages/ linting baseline.
  {
    files: ['public/**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
      'no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-nesting': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'react/prop-types': 'off',
      'react/no-array-index-key': 'off',
      'no-param-reassign': 'off',
      'no-restricted-globals': 'off',
      'react/jsx-pascal-case': 'off',
      'react/jsx-boolean-value': 'off',
      'prefer-destructuring': 'off',
      'no-useless-computed-key': 'off',
      'spaced-comment': 'off',
      'one-var': 'off',
      'lines-between-class-members': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-await-in-loop': 'off',
      'no-template-curly-in-string': 'off',
      'no-bitwise': 'off',
      'no-multi-assign': 'off',
      'no-throw-literal': 'off',
      'no-lonely-if': 'off',
      'array-callback-return': 'off',
      'import/no-named-as-default': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'react/jsx-no-bind': 'off',
      'react/button-has-type': 'off',
      'react/prefer-stateless-function': 'off',
      'import/no-useless-path-segments': 'off',
      'no-unneeded-ternary': 'off',
      'no-useless-return': 'off',
      'prefer-spread': 'off',
      'prefer-exponentiation-operator': 'off',
      'operator-assignment': 'off',
      'no-restricted-properties': 'off',
      'no-else-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/prefer-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'import/order': 'off',
      'import/first': 'off',
      'import/newline-after-import': 'off',
      'import/no-unresolved': 'off',
      'import/export': 'off',
      'sort-class-members/sort-class-members': 'off',
      'react/no-unused-class-component-methods': 'off',
      'no-use-before-define': 'off',
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

export default config;
