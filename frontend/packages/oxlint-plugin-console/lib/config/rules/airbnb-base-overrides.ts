import type { OxlintConfig } from 'oxlint';

export default {
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
  'eslint-js/no-restricted-syntax': 'off',

  // Disallow assignment in return statement
  'no-return-assign': ['error', 'except-parens'],

  // When there is only a single export from a module, prefer using default export over named export.
  'import/prefer-default-export': 'off',

  // Require braces around all control flow bodies
  // Disabled by eslint-config-prettier in the former setup; formatting is
  // now handled by oxfmt, so the rule would conflict with it.
  curly: 'off',

  // The following were disabled by eslint-config-prettier in the former
  // setup; formatting is now handled by oxfmt, so the rules would conflict.
  'no-unexpected-multiline': 'off',
  'unicode-bom': 'off',

  // Deprecated core rules superseded by eslint-plugin-n: the n/* versions
  // run via JS plugins where needed (the node preset); the airbnb defaults
  // stay off to match the former effective configuration.
  'n/no-new-require': 'off',
  'n/no-path-concat': 'off',

  // Require consistent use of this alias
  'eslint-js/consistent-this': ['error', 'that'],

  // Enforce a maximum depth that callbacks can be nested
  'max-nested-callbacks': ['error', 4],

  // Disallow use of alert
  'no-alert': 'error',

  // Disallow use of constant expressions in conditions
  'no-constant-condition': 'error',

  // Devtools console is used across the codebase for debugging in production.
  'no-console': 'off',

  // Sort imports into groups
  'import-js/order': [
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
} satisfies OxlintConfig['rules'];
