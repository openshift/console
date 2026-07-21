/* eslint-disable no-console */
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { sync as glob } from 'glob';
import { parse } from 'comment-json';
import { defineConfig, Plugin } from 'i18next-cli';
import { namespaceToDirName } from './i18n-scripts/namespace-map';

/**
 * Plugin to extract translation keys from console-extensions.json files.
 * Keys matching the format %namespace~key% are extracted.
 */
const consoleExtensionsPlugin = (): Plugin => ({
  name: 'console-extensions',

  async onEnd(keys) {
    for (const filePath of glob('packages/*/console-extensions.json')) {
      const content = await readFile(filePath, 'utf-8');
      const extracted: { key: string }[] = [];

      try {
        parse(
          content,
          (_key, value) => {
            if (typeof value === 'string') {
              const match = value.match(/^%(.+)%$/);
              if (match && match[1]) {
                extracted.push({ key: match[1] });
              }
            }
            return value;
          },
          true,
        );
      } catch (e) {
        console.error(`Failed to parse ${filePath}:`, e);
        throw e;
      }

      for (const { key: fullKey } of extracted) {
        const [ns, key] = fullKey.split('~', 2);
        if (ns && key) {
          keys.set(`${ns}:${key}`, { key, defaultValue: key, ns });
        } else {
          console.warn(`Invalid key format in ${filePath}: ${fullKey}`);
        }
      }
    }
  },
});

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

    sort: false,
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
  plugins: [consoleExtensionsPlugin()],
});
