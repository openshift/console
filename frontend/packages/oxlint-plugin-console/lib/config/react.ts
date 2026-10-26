import type { OxlintConfig } from 'oxlint';
import { mergeRules } from './merge-rules.ts';
import overrides from './rules/airbnb-base-overrides.ts';
import airbnbReact from './rules/airbnb-react.ts';
import reactHooks from './rules/react-hooks.ts';
import react from './rules/react.ts';

// React preset: the base preset plus airbnb's react + jsx-a11y defaults
// (materialized in rules/airbnb-react.ts) and the merged rule files.
const preset: OxlintConfig = {
  plugins: ['react', 'jsx-a11y'],

  env: {
    browser: true,
  },

  jsPlugins: [
    { name: 'react-js', specifier: 'eslint-plugin-react' },
    { name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' },
  ],

  rules: mergeRules(airbnbReact, react, reactHooks, overrides),
};

export default preset;
