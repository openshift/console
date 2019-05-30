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
        name: 'lodash',
        message: 'Use lodash-es instead.',
      },
    ],
    // TODO fix for monorepo support
    'import/no-extraneous-dependencies': 'off',
  },
};
