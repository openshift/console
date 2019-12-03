module.exports = {
  extends: ['plugin:json/recommended'],
  plugins: ['json'],
  rules: {
    'json/*': 'error',
  },
};
