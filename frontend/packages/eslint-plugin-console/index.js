module.exports = {
  rules: {},
  configs: {
    // When extending multiple configurations, add to the list following the order outlined below:

    // Core configs: choose one
    base: require('./lib/config/base'),
    react: require('./lib/config/react'),

    // TypeScript support: choose one
    typescriptParser: require('./lib/config/typescript-parser'),
    typescript: require('./lib/config/typescript'),

    // Augmenting configs: choose one or more
    jest: require('./lib/config/jest'),
    node: require('./lib/config/node'),

    // Add JSON linting (optional)
    json: require('./lib/config/json'),

    // Prettier must go last (optional)
    prettier: require('./lib/config/prettier'),

    // ...or use the pre-composed configurations representing common code archetypes (choose one):

    // Common web preset: React, TypeScript, Prettier
    'react-typescript-prettier': {
      extends: [
        'plugin:console/react',
        'plugin:console/typescript',
        // TODO enable when we stop using jest with jasmine types
        // 'plugin:console/jest',
        'plugin:console/json',
        'plugin:console/prettier',
      ],
      rules: {
        // TODO fix for monorepo support
        'import/no-extraneous-dependencies': 'off',
      },
    },

    // Common Node.js preset: TypeScript, Prettier
    'node-typescript-prettier': {
      extends: [
        'plugin:console/base',
        'plugin:console/typescript',
        'plugin:console/node',
        // TODO enable when we stop using jest with jasmine types
        // 'plugin:console/jest',
        'plugin:console/json',
        'plugin:console/prettier',
      ],
      rules: {
        // TODO fix for monorepo support
        'import/no-extraneous-dependencies': 'off',
        // Allow invocation of require()
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  },
};
