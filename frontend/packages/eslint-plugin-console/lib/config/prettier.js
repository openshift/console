const merge = require('merge');

module.exports = {
  extends: ['prettier', 'prettier/react'],

  plugins: ['prettier'],

  rules: {
    'prettier/prettier': 'error',
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: merge(require('./rules/prettier-typescript'), {
        'prettier/prettier': 'error',
      }),
    },
  ],
};
