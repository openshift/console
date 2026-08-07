import { existsSync } from 'fs';
import { join } from 'path';
import { sync as glob } from 'glob';
import { defineConfig } from 'i18next-cli';
import { namespaceToDirName } from './i18n-scripts/namespace-map';
import { ConsoleExtensionsI18nextCliPlugin } from './i18n-scripts/ConsoleExtensionsI18nextCliPlugin';

export default defineConfig({
  locales: ['en'],
  extract: {
    input: '{public,packages/*}/**/*.{js,jsx,ts,tsx}',
    output: (language, ns) => {
      if (ns === 'public') {
        return join('public', 'locales', language, `${ns}.json`);
      }

      const dir = namespaceToDirName(ns);
      if (existsSync(join('packages', dir, 'locales'))) {
        return join('packages', dir, 'locales', language, `${ns}.json`);
      }

      throw new Error(
        `Namespace "${ns}" does not have a corresponding package directory with a locales folder.`,
      );
    },

    sort: true,
    keySeparator: false,
    nsSeparator: '~',
    defaultNS: 'public',
    warnOnConflicts: 'warn',
    contextSeparator: '_',
    ignore: [
      '**/dist/**',
      '**/node_modules/**',
      '**/console-dynamic-plugin-sdk/src/api/core-api.ts', // has t() in jsdoc that's for documentation only
    ],
  },
  lint: {
    ignore: ['**/*.spec.{js,jsx,ts,tsx}', '**/__tests__/**'],
  },
  plugins: [
    ConsoleExtensionsI18nextCliPlugin({
      paths: glob('packages/*/console-extensions.json'),
    }),
  ],
});
