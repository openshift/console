module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  extends: ['plugin:console/playwright'],
  rules: {
    'no-console': 'off',
    'no-empty-pattern': 'off',
    'no-restricted-syntax': [
      'warn',
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
    'playwright/no-skipped-test': ['warn', { allowConditional: true }],
  },
  overrides: [
    {
      files: ['setup/**/*.ts'],
      rules: {
        'playwright/expect-expect': 'off',
      },
    },
  ],
};
