const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const globals = require('globals');
const path = require('path');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const cypressPlugin = require('eslint-plugin-cypress');
const promisePlugin = require('eslint-plugin-promise');
const nPlugin = require('eslint-plugin-n');
const playwrightPlugin = require('eslint-plugin-playwright');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const SDK_NODE_DIRS = [
  'packages/console-plugin-sdk/src/codegen',
  'packages/console-plugin-sdk/src/webpack',
  'packages/console-dynamic-plugin-sdk/scripts',
  'packages/console-dynamic-plugin-sdk/src/webpack',
];

const PACKAGES_EXCLUDE = [
  'packages/eslint-plugin-console/**',
  ...SDK_NODE_DIRS.map((d) => `${d}/**`),
];

/**
 * ESLint 8 flat config validates plugins per config object — a rule like
 * `prettier/prettier` fails if that config object doesn't carry the `prettier`
 * plugin, even when another config in the array defines it.
 *
 * FlatCompat override configs often omit the plugin.  Additionally,
 * `eslint-config-prettier` disables rules from ~20 plugins (babel, vue,
 * flowtype …) that may not be loaded — those are harmless `off` entries in
 * eslintrc but fail flat config validation.
 *
 * This function:
 *  1. Propagates loaded plugins to config objects that reference their rules.
 *  2. Strips rules whose plugin is not available in any config in the group.
 */
function propagatePlugins(flatConfigs) {
  const allPlugins = {};
  for (const config of flatConfigs) {
    if (config.plugins) {
      Object.assign(allPlugins, config.plugins);
    }
  }

  return flatConfigs.map((config) => {
    if (!config.rules) {
      return config;
    }

    const addPlugins = {};
    const dropRules = [];

    for (const rule of Object.keys(config.rules)) {
      const sep = rule.indexOf('/');
      if (sep <= 0) {
        continue;
      }
      const prefix = rule.slice(0, sep);
      const alreadyDefined = config.plugins && config.plugins[prefix];
      if (alreadyDefined) {
        continue;
      }
      if (allPlugins[prefix]) {
        addPlugins[prefix] = allPlugins[prefix];
      } else {
        dropRules.push(rule);
      }
    }

    const needsChange = Object.keys(addPlugins).length > 0 || dropRules.length > 0;
    if (!needsChange) {
      return config;
    }

    const result = { ...config };
    if (Object.keys(addPlugins).length > 0) {
      result.plugins = { ...(config.plugins || {}), ...addPlugins };
    }
    if (dropRules.length > 0) {
      result.rules = { ...config.rules };
      for (const rule of dropRules) {
        delete result.rules[rule];
      }
    }
    return result;
  });
}

/**
 * Restrict FlatCompat config objects to a directory scope.
 *
 * - Base configs (no `files`) get `files: ['{scopeDir}/**']`.
 * - Override configs with function matchers get the function wrapped to also
 *   require the file to be inside `scopeDir`.
 * - Override configs with glob strings get prefixed with `scopeDir/`.
 *
 * Also propagates plugins so every config that references a plugin rule
 * carries that plugin (required by ESLint 8 flat config).
 */
function scopeTo(flatConfigs, scopeDir, extraIgnores) {
  const absScope = path.resolve(__dirname, scopeDir) + '/';
  const scoped = flatConfigs.map((config) => {
    const result = { ...config };

    if (!config.files) {
      const base = scopeDir === '.' ? '**' : `${scopeDir}/**`;
      result.files = [`${base}/*.{js,jsx,ts,tsx,json}`];
    } else {
      result.files = config.files.map((entry) => {
        if (typeof entry === 'function') {
          return (filePath) => filePath.startsWith(absScope) && entry(filePath);
        }
        return scopeDir === '.' ? entry : `${scopeDir}/${entry}`;
      });
    }

    if (extraIgnores && extraIgnores.length > 0) {
      result.ignores = [...(config.ignores || []), ...extraIgnores];
    }

    return result;
  });

  return propagatePlugins(scoped);
}

module.exports = [
  // ────────────────────────────────────────────────
  // Global ignores (replaces .eslintignore)
  // ────────────────────────────────────────────────
  {
    ignores: [
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
      'eslint.config.js',
      '**/tsconfig.json',
      'e2e/package.json',
      'test-results/**',
      'yarn.lock',
      '.vscode/**',
      '**/.*',
      'e2e/**/testData/**',
    ],
  },

  // ────────────────────────────────────────────────
  // Scope: Root frontend (non-packages, non-i18n-scripts, non-e2e)
  // Replaces: frontend/.eslintrc.js
  // ────────────────────────────────────────────────
  ...scopeTo(
    compat.config({
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
    '.',
    ['packages/**', 'i18n-scripts/**', 'e2e/**'],
  ),

  // ────────────────────────────────────────────────
  // Scope: packages/ (react-typescript-prettier)
  // Replaces: frontend/packages/.eslintrc.js
  // ────────────────────────────────────────────────
  ...scopeTo(
    compat.extends('plugin:console/react-typescript-prettier'),
    'packages',
    PACKAGES_EXCLUDE,
  ),

  // ────────────────────────────────────────────────
  // Scope: Cypress integration tests (overlay on packages config)
  // Replaces: 4x integration-tests/.eslintrc files
  // ────────────────────────────────────────────────
  ...compat.extends('plugin:cypress/recommended').map((c) => ({
    ...c,
    files: c.files || [
      'packages/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/dev-console/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/knative-plugin/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/helm-plugin/integration-tests/**/*.{js,jsx,ts,tsx}',
    ],
  })),
  {
    files: [
      'packages/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/dev-console/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/knative-plugin/integration-tests/**/*.{js,jsx,ts,tsx}',
      'packages/helm-plugin/integration-tests/**/*.{js,jsx,ts,tsx}',
    ],
    plugins: {
      promise: promisePlugin,
      cypress: cypressPlugin,
    },
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
    plugins: {
      '@typescript-eslint': tsPlugin,
      cypress: cypressPlugin,
    },
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

  // ────────────────────────────────────────────────
  // Scope: SDK Node.js directories (node-typescript-prettier)
  // Replaces: 4x .eslintrc.js in codegen/webpack/scripts dirs
  // ────────────────────────────────────────────────
  ...SDK_NODE_DIRS.flatMap((dir) =>
    scopeTo(compat.extends('plugin:console/node-typescript-prettier'), dir),
  ),
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

  // ────────────────────────────────────────────────
  // Scope: eslint-plugin-console (base + node + json + prettier)
  // Replaces: packages/eslint-plugin-console/.eslintrc
  // ────────────────────────────────────────────────
  ...scopeTo(
    compat.extends(
      'plugin:console/base',
      'plugin:console/node',
      'plugin:console/json',
      'plugin:console/prettier',
    ),
    'packages/eslint-plugin-console',
  ),

  // ────────────────────────────────────────────────
  // Scope: i18n-scripts (node-typescript-prettier)
  // Replaces: frontend/i18n-scripts/.eslintrc.js
  // ────────────────────────────────────────────────
  ...scopeTo(compat.extends('plugin:console/node-typescript-prettier'), 'i18n-scripts'),
  {
    files: ['i18n-scripts/**/*.{js,ts}'],
    plugins: { n: nPlugin },
    rules: {
      'no-console': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },

  // ────────────────────────────────────────────────
  // Scope: e2e (Playwright)
  // Replaces: e2e/.eslintrc.cjs
  // ────────────────────────────────────────────────
  ...scopeTo(compat.extends('plugin:console/playwright'), 'e2e'),
  {
    files: ['e2e/**/*.{js,ts}'],
    ignores: ['e2e/**/testData/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: path.join(__dirname, 'e2e'),
      },
    },
    plugins: { playwright: playwrightPlugin },
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
    plugins: { playwright: playwrightPlugin },
    rules: {
      'playwright/expect-expect': 'off',
    },
  },
];
