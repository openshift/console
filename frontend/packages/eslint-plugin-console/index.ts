module.exports = {
  rules: {},
  configs: {
    // When extending multiple configurations, add to the list following the order outlined below:

    // Core configs: choose one
    base: require('./lib/config/base.ts'),
    react: require('./lib/config/react.ts'),

    // TypeScript support: choose one
    typescriptParser: require('./lib/config/typescript-parser.ts'),
    typescript: require('./lib/config/typescript.ts'),

    // Augmenting configs: choose one or more
    jest: require('./lib/config/jest.ts'),
    playwright: require('./lib/config/playwright.ts'),

    node: require('./lib/config/node.ts'),

    // Add JSON linting (optional)
    json: require('./lib/config/json.ts'),

    // Prettier must go last (optional)
    prettier: require('./lib/config/prettier.ts'),

    // ...or use the pre-composed configurations representing common code archetypes (choose one):

    // Common web preset: React, TypeScript, Prettier, Testing Library on tests
    'react-typescript-prettier': {
      extends: [
        'plugin:console/react',
        'plugin:console/typescript',
        'plugin:console/jest',
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
        'plugin:console/jest',
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
