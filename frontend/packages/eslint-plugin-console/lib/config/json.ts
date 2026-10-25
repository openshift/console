module.exports = {
  extends: ['plugin:json/recommended-legacy'],

  plugins: ['json'],

  rules: {
    'json/*': 'error',
  },

  overrides: [
    {
      files: ['**/console-extensions.json'],
      rules: {
        'json/*': ['error', { allowComments: true }],
      },
    },
  ],
};
