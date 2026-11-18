import testingLibraryPlugin from 'eslint-plugin-testing-library';
import type { OxlintConfig } from 'oxlint';

// testing-library rules run via the eslint-plugin-testing-library JS plugin,
// so its recommended ruleset can be spread directly (it stays in sync with
// the plugin version). The jest/* rules run via oxlint's NATIVE jest plugin
// instead: eslint-plugin-jest's recommended set cannot be spread blindly
// because it may reference rules oxlint has not implemented natively, so
// that list is hand-maintained and filtered to native coverage.
export default {
  ...testingLibraryPlugin.configs['flat/react'].rules,

  // Prefer explicit assertions over implicit ones
  'testing-library/prefer-explicit-assert': 'error',

  // Prefer user-event over fireEvent
  'testing-library/prefer-user-event': 'error',

  // Prefer user-event setup over direct fireEvent calls
  'testing-library/prefer-user-event-setup': 'error',

  // Sometimes custom assertions wrappers are used
  'jest/expect-expect': 'off',

  // Disallow commented out tests
  'jest/no-commented-out-tests': 'error',

  // Make it easier to find failing tests by preventing duplicate test names in a suite.
  'jest/no-identical-title': 'error',

  // Disallow Jasmine globals (we are not using Jasmine)
  'jest/no-jasmine-globals': 'error',

  // Use .only and .skip over f and x
  'jest/no-test-prefixes': 'error',

  // Suggest using test.todo()
  'jest/prefer-todo': 'error',

  // Disallow manually importing from `__mocks__`
  'jest/no-mocks-import': 'error',

  // Prefer explicit assertions over snapshots
  'jest/no-restricted-matchers': [
    'error',
    {
      toMatchSnapshot:
        'Do not use toMatchSnapshot(); use explicit assertions (e.g. toStrictEqual on focused objects, getByRole, etc.).',
      toMatchInlineSnapshot: 'Do not use toMatchInlineSnapshot(); use explicit assertions instead.',
      toThrowErrorMatchingSnapshot:
        'Do not use toThrowErrorMatchingSnapshot(); assert on error message or type explicitly.',
      toThrowErrorMatchingInlineSnapshot:
        'Do not use toThrowErrorMatchingInlineSnapshot(); assert on error message or type explicitly.',
    },
  ],

  // From plugin:jest/recommended, filtered to oxlint's native jest plugin
  'jest/no-alias-methods': 'error',
  'jest/no-conditional-expect': 'error',
  'jest/no-deprecated-functions': 'error',
  'jest/no-disabled-tests': 'warn',
  'jest/no-done-callback': 'error',
  'jest/no-export': 'error',
  'jest/no-focused-tests': 'error',
  'jest/no-interpolation-in-snapshots': 'error',
  'jest/no-standalone-expect': 'error',
  'jest/valid-describe-callback': 'error',
  'jest/valid-expect': 'error',
  'jest/valid-expect-in-promise': 'error',
  'jest/valid-title': 'error',
} satisfies OxlintConfig['rules'];
