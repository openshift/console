module.exports = {
  root: true,
  env: {
    'cypress/globals': true,
    node: true,
  },
  extends: ['plugin:cypress/recommended'],
  plugins: ['cypress'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018,
  },
  rules: {
    'no-console': 'off',
    'cypress/unsafe-to-chain-command': 'off',
  },
};
