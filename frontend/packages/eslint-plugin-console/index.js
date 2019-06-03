module.exports = {
  rules: {},
  configs: {
    // When extending multiple configuratioons, add to the list following the order outlined below:

    // Core configs: choose one
    base: require('./lib/config/base'),
    react: require('./lib/config/react'),

    // TypeScript support: choose one
    typescriptParser: require('./lib/config/typescript-parser'),
    typescript: require('./lib/config/typescript'),

    // Augmenting configs: choose one or more
    jest: require('./lib/config/jest'),
    node: require('./lib/config/node'),

    // Prettier must go last
    prettier: require('./lib/config/prettier'),
  },
};
