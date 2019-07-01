module.exports = {
  root: true,
  extends: [
    'plugin:console/react',
    'plugin:console/typescript',
    // TODO enable when we stop using jest with jasmine types
    // 'plugin:console/jest',
    'plugin:console/prettier',
  ],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        name: 'lodash-es',
        message: 'Use lodash instead. webpack is configured to use lodash-es automatically.',
      },
    ],
    // TODO fix for monorepo support
    'import/no-extraneous-dependencies': 'off',
    'no-underscore-dangle': 'off',
  },
};
