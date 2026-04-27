module.exports = {
  root: true,
  extends: ['plugin:console/node-typescript-prettier'],
  rules: {
    'no-console': 'off',
    // fs.promises requires a newer version of node however our compliance is set to node >=10
    'n/no-unsupported-features/node-builtins': 'off',
  },
};
