module.exports = {
  extends: ['airbnb-base'],

  parserOptions: {
    ecmaVersion: 2018,
  },

  env: {
    es6: true,
  },

  plugins: ['promise', 'sort-class-members', 'no-barrel-files'],

  rules: require('merge')(
    require('./rules/promise.ts'),
    require('./rules/sort-class-members.ts'),
    require('./rules/airbnb-base-overrides.ts'),
    {
      'no-barrel-files/no-barrel-files': 'error',
    },
  ),
};
