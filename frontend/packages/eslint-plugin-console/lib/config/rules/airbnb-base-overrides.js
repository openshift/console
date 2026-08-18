module.exports = {
  // Enforce that class methods utilize this
  'class-methods-use-this': 'off',

  // Require or disallow named function expressions
  'func-names': 'off',

  // Disallow nested ternary expressions
  'no-nested-ternary': 'off',

  // Disallow reassignment of function parameters
  'no-param-reassign': [
    'error',
    {
      props: false,
    },
  ],

  // Disallow the unary operators ++ and --
  'no-plusplus': 'off',

  // Disallow specified syntax
  'no-restricted-syntax': 'off',

  // Disallow assignment in return statement
  'no-return-assign': ['error', 'except-parens'],

  // When there is only a single export from a module, prefer using default export over named export.
  'import/prefer-default-export': 'off',

  // Require braces around all control flow bodies
  curly: ['error', 'all'],

  // Require consistent return statements
  'consistent-return': 'off',

  // Require consistent use of this alias
  'consistent-this': ['warn', 'that'],

  // Enforce a maximum depth that callbacks can be nested
  'max-nested-callbacks': ['warn', 4],

  // Disallow use of alert
  'no-alert': 'error',

  // Disallow use of constant expressions in conditions
  'no-constant-condition': 'error',

  // Disallow console statements
  'no-console': 'error',

  // Sort imports into groups
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      pathGroups: [
        {
          pattern: 'react',
          group: 'external',
          position: 'before',
        },
        {
          pattern: '@console/**',
          group: 'internal',
          position: 'before',
        },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
      'newlines-between': 'never',
    },
  ],

  // Legitimate use cases for require() exist, such as in the eslint config and in core-api.ts
  'global-require': 'off',

  /* ------------------------ New Rules as of eslint-config-airbnb-base v14.0.0 -------------------------

  TODO The following rules are disabled since they are new and cause failures. Need follow up.

  ------------------------------------------------------------------------------------------------*/

  // Ensure consistent use of file extension within the import path
  'import/extensions': 'off',

  // enforce a maximum number of classes per file
  'max-classes-per-file': 'off',

  // Disallow dangling underscores in identifiers
  'no-underscore-dangle': 'off',

  // Disallow use of Object.prototypes builtins directly
  'no-prototype-builtins': 'off',

  // disallow unnecessary `catch` clauses
  'no-useless-catch': 'off',

  // Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead.
  'prefer-object-spread': 'off',

  // Require object shorthand for properties only
  'object-shorthand': ['error', 'properties'],

  // Require const for variables that are never reassigned after declared
  'prefer-const': ['error', { destructuring: 'all' }],

  // Disallow assignments that can lead to race conditions due to usage of `await` or `yield`
  'require-atomic-updates': 'off',
};
