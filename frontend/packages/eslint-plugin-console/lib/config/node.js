const merge = require('merge');

module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },

  env: {
    es6: true,
    node: true,
  },

  plugins: ['node'],

  rules: merge(require('./rules/node'), {
    'no-process-env': 'off',
  }),
};
