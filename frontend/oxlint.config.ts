import { defineConfig } from 'oxlint';
import configs from 'oxlint-plugin-console';
import packageJson from './package.json' with { type: 'json' };

const REPO_TOOLING = [
  'packages/console-plugin-sdk/src/codegen',
  'packages/console-dynamic-plugin-sdk/scripts',
  'packages/console-dynamic-plugin-sdk/src/webpack',
  'packages/oxlint-plugin-console',
  'scripts',
  'i18n-scripts',
];

const config = defineConfig({
  // The default `correctness` category is disabled so that oxlint enforces
  // exactly the rules from the oxlint-plugin-console presets, nothing more.
  categories: { correctness: 'allow' },
  plugins: [
    ...new Set([
      ...configs.reactTypescript.plugins,
      ...configs.nodeTypescript.plugins,
      ...configs.jest.plugins,
    ]),
  ],
  extends: [configs.jest],
  settings: {
    react: { version: packageJson.dependencies.react.replace(/^[^0-9]*/, '') },
    'import/resolver': {
      node: { extensions: ['.js', '.json'] },
      typescript: {},
    },
  },
  ignorePatterns: [
    '**/dist/**',
    '**/generated/**',
    '**/node_modules/**',
    '.vscode/**',
    '.yarn/**',
    '__coverage__/**',
    'test-results/**',
    'yarn.lock',
  ],
  overrides: [
    // frontend code
    {
      files: ['public/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
      excludeFiles: REPO_TOOLING.map((dir) => `${dir}/**`),
      ...configs.reactTypescript,
      globals: {
        process: 'readonly',
        React: 'writable',
        JSX: 'readonly',
        NodeJS: 'readonly',
        Subject: 'readonly',
        Diff: 'readonly',
        BlobPropertyBag: 'readonly',
        VoidFunction: 'readonly',
        RequestInit: 'readonly',
      },
    },

    // repo tooling
    {
      files: ['./*.ts', './*.tsx', ...REPO_TOOLING.map((dir) => `${dir}/**/*.{ts,tsx}`)],
      ...configs.nodeTypescript,
    },

    // e2e tests
    {
      files: ['e2e/**/*.{ts,tsx}'],
      excludeFiles: ['e2e/**/testData/**'],
      ...configs.playwright,
    },
  ],
});

export default config;
