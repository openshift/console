const merge = require('merge');

module.exports = {
  extends: ['plugin:console/base', 'airbnb'],

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },

  env: {
    browser: true,
  },

  plugins: ['react-hooks'],

  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: merge(
    require('./rules/react'),
    require('./rules/react-hooks'),
    require('./rules/airbnb-base-overrides'),
  ),

  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        // Restrict file extensions that may contain JSX
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
        // Disable JS specific rules
        'react/default-props-match-prop-types': 'off',
        // Prevent missing props validation in a React component definition
        // Off due to false positives in typescript
        'react/prop-types': 'off',
      },
    },
  ],
};
