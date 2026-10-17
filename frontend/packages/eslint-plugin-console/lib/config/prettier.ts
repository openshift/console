module.exports = {
  extends: ['prettier'],

  plugins: ['prettier'],

  rules: {
    'prettier/prettier': 'error',
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'prettier/prettier': 'error',
      },
    },
  ],
};
