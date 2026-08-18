const merge = require('merge');

module.exports = {
  overrides: [
    {
      files: ['**/__tests__/**/*.{tsx,ts,js}', '**/*.spec.{tsx,ts,js}'],
      excludedFiles: ['**/*.cy.{ts,tsx,js}'],

      env: {
        'jest/globals': true,
      },

      plugins: ['testing-library', 'jest'],

      extends: ['plugin:testing-library/react', 'plugin:jest/recommended'],

      parserOptions: {
        ecmaVersion: 2021,
      },

      rules: merge(require('./rules/jest')),
    },
  ],
};
