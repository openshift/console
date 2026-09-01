module.exports = {
  plugins: ['playwright'],
  extends: ['plugin:playwright/recommended'],
  rules: {
    'no-empty-pattern': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.property.name="waitFor"]',
        message:
          'Playwright actions (click, fill, check, clear) auto-wait for actionability. ' +
          'Do not call waitFor() before an action on the same locator. ' +
          'If this waitFor() is intentional (waiting for state without a subsequent action), ' +
          'add // eslint-disable-next-line no-restricted-syntax',
      },
    ],
    'playwright/no-conditional-in-test': 'off',
    'playwright/no-skipped-test': ['error', { allowConditional: true }],
  },
};
