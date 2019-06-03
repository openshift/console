const merge = require('merge');

module.exports = {
  env: {
    'jest/globals': true,
  },

  plugins: ['jest'],

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },

  rules: merge(require('./rules/jest')),
};
