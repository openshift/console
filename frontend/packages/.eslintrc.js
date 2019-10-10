module.exports = {
  root: true,
  extends: ['plugin:console/react-typescript-prettier'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        name: 'lodash-es',
        message: 'Use lodash instead. webpack is configured to use lodash-es automatically.',
      },
    ],
  },
};
