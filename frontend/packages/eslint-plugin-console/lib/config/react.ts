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

  rules: require('merge')(
    require('./rules/react.ts'),
    require('./rules/react-hooks.ts'),
    require('./rules/airbnb-base-overrides.ts'),
  ),

  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        // Disable JS specific rules
        'react/default-props-match-prop-types': 'off',
        // Prevent missing props validation in a React component definition
        // Off due to false positives in typescript
        'react/prop-types': 'off',
        // React 17 doesn't require this anymore
        'react/react-in-jsx-scope': 'off',
      },
    },
  ],
};
