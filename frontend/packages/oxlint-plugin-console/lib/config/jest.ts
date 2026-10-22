// Jest preset: the test-file overlay. `jest/*` rules are native;
// `testing-library/*` rules run via its ESLint plugin (JS plugin). The
// preset self-scopes to test files instead of relying on a scope block in
// the root config.
import type { OxlintConfig } from 'oxlint';
import rules from './rules/jest.ts';

const preset: OxlintConfig = {
  plugins: ['jest'],

  overrides: [
    {
      files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      excludeFiles: ['e2e/**'],
      env: {
        jest: true,
        node: true,
      },
      jsPlugins: ['eslint-plugin-testing-library'],
      rules,
    },
  ],
};
export default preset;
