import { ConsoleExtensionsI18nextCliPlugin } from '../frontend/i18n-scripts/ConsoleExtensionsI18nextCliPlugin';
import { defineConfig } from 'i18next-cli';

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
  plugins: [ConsoleExtensionsI18nextCliPlugin()],
});
