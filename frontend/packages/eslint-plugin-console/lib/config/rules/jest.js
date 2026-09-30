module.exports = {
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
};
