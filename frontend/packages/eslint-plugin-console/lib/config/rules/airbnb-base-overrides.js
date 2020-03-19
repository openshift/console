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

  // Disallow Unused Expressions
  'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],

  // Disallow console statements
  'no-console': 'error',

  // TODO This rule was not working as expected prior to eslint-config-airbnb-base v14.0.0
  // Disabling for now since it is causing failures after the update.
  // Sort imports into groups
  // 'import/order': [
  //   'error',
  //   {
  //     groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
  //     'newlines-between': 'never',
  //   },
  // ],
  'import/order': 'off',

  /* ------------------------ New Rules as of eslint-config-airbnb-base v14.0.0 -------------------------

  TODO The following rules are disabled since they are new and cause failures. Need follow up.

  ------------------------------------------------------------------------------------------------*/

  // Ensure consistent use of file extension within the import path
  'import/extensions': 'off',

  // enforce a maximum number of classes per file
  'max-classes-per-file': 'off',

  // Disallow use of Object.prototypes builtins directly
  'no-prototype-builtins': 'off',

  // disallow unnecessary `catch` clauses
  'no-useless-catch': 'off',

  // Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead.
  'prefer-object-spread': 'off',

  // Disallow assignments that can lead to race conditions due to usage of `await` or `yield`
  'require-atomic-updates': 'off',
};
