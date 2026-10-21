const merge = require('merge');

module.exports = {
  extends: ['airbnb-base'],

  parserOptions: {
    ecmaVersion: 2018,
  },

  env: {
    es6: true,
  },

  plugins: ['promise', 'sort-class-members'],

  rules: merge(
    require('./rules/promise'),
    require('./rules/sort-class-members'),
    require('./rules/airbnb-base-overrides'),
  ),
};
