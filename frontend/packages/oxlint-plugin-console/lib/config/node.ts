module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },

  env: {
    es6: true,
    node: true,
  },

  plugins: ['n'],

  rules: require('merge')(require('./rules/node.ts'), {
    'no-process-env': 'off',
  }),
};
