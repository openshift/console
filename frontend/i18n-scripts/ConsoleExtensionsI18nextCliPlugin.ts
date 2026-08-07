/* eslint-disable no-console */
import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { parse } from 'comment-json';
import type { Plugin } from 'i18next-cli';

export interface ConsoleExtensionsI18nextCliPluginOptions {
  /**
   * Paths to the console-extensions.json file, assumed to be encoded as UTF-8.
   *
   * Defaults to `console-extensions.json` in the current working directory.
   */
  paths?: string[];
}

/**
 * A [i18next-cli] plugin to extract translation keys from `console-extensions.json` files.
 *
 * Keys matching the format `%namespace~key%` are extracted.
 *
 * NOTE: `i18next-cli` does not appear to fully respect semver. Compatibility is only
 * known if you are using the exact same version of `i18next-cli` that Console is using.
 *
 * @returns a [i18next-cli] plugin instance
 *
 * [i18next-cli]: https://github.com/i18next/i18next-cli
 */
export const ConsoleExtensionsI18nextCliPlugin = ({
  paths = ['console-extensions.json'],
}: ConsoleExtensionsI18nextCliPluginOptions = {}): Plugin => ({
  name: 'console-extensions',

  async onEnd(keys) {
    const files = await Promise.all(
      paths.map((path) =>
        readFile(path, 'utf-8').catch(() => {
          console.warn(chalk.yellowBright(`Warning: Could not read file at ${path}. Skipping.`));
          return '{}';
        }),
      ),
    );

    for (const [idx, content] of files.entries()) {
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
        console.error(`Failed to parse ${paths[idx]}:`, e);
        throw e;
      }

      for (const { key: fullKey } of extracted) {
        const sep = fullKey.indexOf('~');
        if (sep > 0 && sep < fullKey.length - 1) {
          const ns = fullKey.slice(0, sep);
          const key = fullKey.slice(sep + 1);
          keys.set(`${ns}:${key}`, { key, defaultValue: key, ns });
        } else {
          console.warn(chalk.yellowBright(`Invalid key format in ${paths[idx]}: ${fullKey}`));
        }
      }
    }
  },
});
