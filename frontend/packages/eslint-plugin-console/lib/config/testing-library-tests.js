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
 */
module.exports = {
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      plugins: ['testing-library'],
      extends: ['plugin:testing-library/react'],
      rules: {
        'testing-library/prefer-explicit-assert': 'error',
        'testing-library/prefer-user-event': 'error',
        'testing-library/prefer-user-event-setup': 'error',
      },
    },
  ],
};
