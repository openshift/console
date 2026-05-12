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
