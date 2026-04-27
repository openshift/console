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

  /* ---- Rules new/changed in eslint-config-airbnb-base v15 / ESLint v8 ---- */

  // Default parameters should be last (new in airbnb v15)
  'default-param-last': 'off',

  // Disallow relative package imports (new in airbnb v15)
  'import/no-relative-packages': 'off',

  // Disallow cyclical imports (new in airbnb v15)
  'import/no-cycle': 'off',

  // Disallow named default exports (noisy with TypeScript re-exports)
  'import/no-named-as-default-member': 'off',

  // Prefer arrow functions as callbacks (new in airbnb v15)
  'prefer-arrow-callback': 'off',

  // Disallow returning values from Promise executor (new in eslint:recommended v8)
  'no-promise-executor-return': 'off',

  // Require arrow function bodies to use braces (new in airbnb v15)
  'arrow-body-style': 'off',

  // Ensure named imports match exported names (too many false positives with TypeScript)
  'import/named': 'off',

  // global-require was removed from ESLint core in v7 but airbnb still references it
  'global-require': 'off',

  // New rules from eslint:recommended v8 - disabled for now, enable in follow-up PRs
  'no-unsafe-optional-chaining': 'off',
  'no-import-assign': 'off',
  'no-constructor-return': 'off',
  'prefer-regex-literals': 'off',
  'no-restricted-exports': 'off',
};
