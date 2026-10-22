import type { OxlintConfig } from 'oxlint';
import { mergeRules } from './merge-rules.ts';
import overrides from './rules/airbnb-base-overrides.ts';
import airbnbBase from './rules/airbnb-base.ts';
import promise from './rules/promise.ts';

// Base preset: airbnb-base defaults (materialized in rules/airbnb-base.ts)
// plus the promise rules and console overrides. sort-class-members has no
// oxlint implementation and is not enforced.
const preset: OxlintConfig = {
  plugins: ['import', 'promise', 'unicorn', 'oxc'],

  env: {
    es6: true,
  },

  jsPlugins: [
    // n/no-new-require and n/no-path-concat supersede the deprecated core rules
    'eslint-plugin-n',
    // import rules without a native oxlint implementation
    { name: 'import-js', specifier: 'eslint-plugin-import' },
    // ESLint core rules without a native oxlint implementation
    'oxlint-plugin-console/lib/js-plugins/eslint-js-rules.ts',
  ],

  // oxc/no-barrel-file is ratcheted as a warning: oxlint's module-count
  // threshold over-reports relative to the former eslint-plugin-no-barrel-files.
  rules: mergeRules(airbnbBase, promise, overrides, { 'oxc/no-barrel-file': 'warn' }),
};

export default preset;
