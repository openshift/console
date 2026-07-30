/**
 * React Testing Library (RTL) test-only ESLint override.
 * Used as `plugin:console/testing-library-tests` from the root and `package` .eslintrc stacks.
 *
 * Tooling: **ESLint 8** (via `eslint-plugin-console`) and **eslint-plugin-testing-library** 6+ / 7.x.
 * `extends: ['plugin:testing-library/react']` applies the upstream React ruleset, which already
 * includes (among others):
 *   - `no-node-access`, `no-unnecessary-act`, `render-result-naming-convention`
 *   - `await-async-events` (userEvent), `no-await-sync-events` (fireEvent)
 *   - `prefer-screen-queries`, `prefer-presence-queries`, `prefer-find-by`
 *   - `no-wait-for-side-effects` (replaces the removed `no-wait-for-empty-callback` in older plugin majors)
 *
 * The following **additional** rules are turned on, which are not enabled in `plugin:testing-library/react` by default.
 *
 * `jest/no-restricted-matchers` is applied here (not via `extends: ['plugin:console/jest']`) so snapshot
 * matchers are blocked under the same test `files` globs as RTL rules, without enabling the full Jest
 * ruleset from `rules/jest.js` (that preset is still omitted from `react-typescript-prettier`; turning
 * it on globally would surface many legacy violations).
 */
const jestRules = require('./rules/jest');

module.exports = {
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      excludedFiles: ['e2e/**'],
      plugins: ['testing-library', 'jest'],
      env: {
        'jest/globals': true,
      },
      extends: ['plugin:testing-library/react'],
      rules: {
        'testing-library/prefer-explicit-assert': 'error',
        'testing-library/prefer-user-event': 'error',
        'testing-library/prefer-user-event-setup': 'error',
        'jest/no-restricted-matchers': jestRules['jest/no-restricted-matchers'],
      },
    },
  ],
};
