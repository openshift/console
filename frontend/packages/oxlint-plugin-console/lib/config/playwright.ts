import type { OxlintConfig } from 'oxlint';
import rules from './rules/playwright.ts';

// Playwright rules for the e2e scope: `playwright/*` rules run via
// eslint-plugin-playwright (JS plugin); the no-restricted-syntax guard
// (forbidding waitFor() before actions) comes from the eslint-js shim.
// This is a flat preset that oxlint.config.ts scopes to the e2e tree.
const preset: OxlintConfig = {
  jsPlugins: [
    'eslint-plugin-playwright',
    'oxlint-plugin-console/lib/js-plugins/eslint-js-rules.ts',
  ],
  rules,
};

export default preset;
