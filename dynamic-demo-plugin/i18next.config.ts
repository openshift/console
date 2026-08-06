import { readFile } from 'node:fs/promises';
import jsonc from 'comment-json';
import { defineConfig, Plugin } from 'i18next-cli';

/**
 * Custom JSON parser for localizing keys matching format: /%.+%/
 */
const consoleExtensionsPlugin = (): Plugin => ({
  name: 'console-extensions',

  async onEnd(keys) {
    const content = await readFile('console-extensions.json', 'utf-8');
    const extracted: { key: string }[] = [];

    try {
      jsonc.parse(
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
      console.error('Failed to parse as JSON.', e);
      extracted.length = 0;
    }

    for (const { key: fullKey } of extracted) {
      const [ns, key] = fullKey.split('~', 2);

      if (ns && key) {
        keys.set(`${ns}:${key}`, { key, defaultValue: key, ns });
      } else {
        console.warn(`Invalid key format: ${fullKey}`);
      }
    }
  },
});

export default defineConfig({
  locales: ['en'],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'locales/{{language}}/{{namespace}}.json',

    sort: true,
    keySeparator: false,
    nsSeparator: '~',
    defaultNS: 'plugin__console-demo-plugin',
  },
  plugins: [consoleExtensionsPlugin()],
});
