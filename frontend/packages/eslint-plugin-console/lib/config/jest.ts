module.exports = {
  overrides: [
    {
      files: ['**/__tests__/**/*.{tsx,ts}', '**/*.spec.{tsx,ts}'],

      env: {
        'jest/globals': true,
      },

      plugins: ['testing-library', 'jest'],

      extends: ['plugin:testing-library/react', 'plugin:jest/recommended'],

      parserOptions: {
        ecmaVersion: 2021,
      },

      rules: require('merge')(require('./rules/jest.ts')),
    },
  ],
};
