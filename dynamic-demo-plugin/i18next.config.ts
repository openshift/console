import { ConsoleExtensionsI18nextCLIPlugin } from '../frontend/i18n-scripts/ConsoleExtensionsI18nextCLIPlugin';
import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en'],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'locales/{{language}}/{{namespace}}.json',

    defaultValue: (key) => key.replace(/_(?:one|other)$/, ''),
    sort: true,
    keySeparator: false,
    nsSeparator: '~',
    defaultNS: 'plugin__console-demo-plugin',
  },
  plugins: [ConsoleExtensionsI18nextCLIPlugin()],
});
