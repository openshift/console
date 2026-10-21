const merge = require('merge');

module.exports = {
  env: {
    'jest/globals': true,
  },

  plugins: ['jest'],

  parserOptions: {
    ecmaVersion: 2018,
  },

  rules: merge(require('./rules/jest')),
};
