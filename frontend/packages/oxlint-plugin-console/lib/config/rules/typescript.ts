import type { OxlintConfig } from 'oxlint';

// See https://github.com/typescript-eslint
// See https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin

export default {
  // Require that member overloads be consecutive
  'typescript/adjacent-overload-signatures': 'error',

  // Requires using either T[] or Array<T> for arrays
  'typescript/array-type': 'error',

  //	Disallows awaiting a value that is not a Thenable
  'typescript/await-thenable': 'error',

  // Disallow `@ts-<directive>` comments or require descriptions after directives
  'typescript/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': true,
      'ts-nocheck': true,
      'ts-check': false,
    },
  ],

  // In @typescript-eslint v6, ban-types was split into:
  //   no-restricted-types (custom bans, no defaults)
  //   no-empty-object-type (bans {})
  //   no-unsafe-function-type (bans Function)
  // Our old config allowed {}, Function, and object, so disable the new rules.
  'typescript/no-empty-object-type': 'off',
  'typescript/no-unsafe-function-type': 'off',

  // Require explicit return types on functions and class methods
  'typescript/explicit-function-return-type': 'off',

  // Require explicit accessibility modifiers on class properties and methods
  'typescript/explicit-member-accessibility': 'off',

  // Enforces the use of as Type assertions instead of <Type> assertions
  'typescript/consistent-type-assertions': 'off',

  // Disallow generic Array constructors
  'no-array-constructor': 'error',

  // Disallow usage of the any type
  'typescript/no-explicit-any': 'off',

  // Forbids the use of classes as namespaces
  'typescript/no-extraneous-class': 'error',

  // Disallow iterating over an array with a for-in loop
  'typescript/no-for-in-array': 'error',

  // Disallows explicit type declarations for variables or parameters initialized to a number, string, or boolean
  'typescript/no-inferrable-types': 'off',

  // Disallows magic numbers
  'no-magic-numbers': 'off',

  // Enforce valid definition of new and constructor
  'typescript/no-misused-new': 'error',

  // Disallow the use of custom TypeScript modules and namespaces
  'typescript/no-namespace': 'off',

  // Disallows non-null assertions using the ! postfix operator
  'typescript/no-non-null-assertion': 'error',

  // Disallow the use of parameter properties in class constructors
  'typescript/no-require-imports': 'error',

  // Force consistent usage of type imports
  'typescript/consistent-type-imports': 'error',

  // Disallow aliasing this
  'typescript/no-this-alias': ['error', { allowDestructuring: true }],

  // Disallow /// <reference path='' /> comments
  'typescript/triple-slash-reference': ['error', { path: 'never', types: 'never', lib: 'never' }],

  // Warns when a namespace qualifier is unnecessary
  'typescript/no-unnecessary-qualifier': 'error',

  // Warns if a type assertion does not change the type of an expression
  'typescript/no-unnecessary-type-assertion': 'error',

  // Disallow Unused Expressions,
  'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],

  // Disallow unused variables
  'no-unused-vars': ['error', { ignoreRestSiblings: true, caughtErrors: 'none' }],

  // Disallow the use of variables before they are defined
  'no-use-before-define': 'error',

  // Disallow unnecessary constructors
  'no-useless-constructor': 'error',

  // Disallow variable declarations from shadowing variables declared in the outer scope
  'no-shadow': 'error',

  // Prefer a 'for-of' loop over a standard 'for' loop if the index is only used to access the array being iterated
  'typescript/prefer-for-of': 'error',

  // Use function types instead of interfaces with call signatures
  'typescript/prefer-function-type': 'error',

  // Enforce includes method over indexOf method
  'typescript/prefer-includes': 'error',

  // Require the use of the namespace keyword instead of the module keyword to declare custom TypeScript modules
  'typescript/prefer-namespace-keyword': 'error',

  // Prefer RegExp#exec() over String#match() if no global flag is provided
  'typescript/prefer-regexp-exec': 'error',

  // Enforce the use of String#startsWith and String#endsWith instead of other equivalent methods of checking substrings
  'typescript/prefer-string-starts-ends-with': 'error',

  // Requires any function or method that returns a Promise to be marked async
  'typescript/promise-function-async': 'error',

  // Enforce giving compare argument to Array#sort
  'typescript/require-array-sort-compare': 'error',

  // When adding two variables, operands must both be of type number or of type string
  'typescript/restrict-plus-operands': 'error',

  // Enforces unbound methods are called with their expected scope
  'typescript/unbound-method': 'error',

  // Warns for any two overloads that could be unified into one by using a union or an optional/rest parameter
  'typescript/unified-signatures': 'error',

  // Replaces base no-empty-function rule, handling TypeScript code that would otherwise trigger the rule
  'no-empty-function': ['error', { allow: ['arrowFunctions'] }],

  /**
   * 1. Disable things that are checked by Typescript
   */
  // Checked by Typescript - ts(2378)
  'getter-return': 'off',
  // Checked by Typescript - ts(1117)
  'no-dupe-keys': 'off',
  // Checked by Typescript - ts(7027)
  'no-unreachable': 'off',
  // Checked by Typescript - ts(2367)
  'valid-typeof': 'off',
  'no-const-assign': 'off',
  // Checked by Typescript - ts(2376)
  'no-this-before-super': 'off',
  // This is checked by Typescript using the option `strictNullChecks`.
  'no-undef': 'off',
  // This is already checked by Typescript.
  'no-dupe-class-members': 'off',
  // This is already checked by Typescript.
  'no-redeclare': 'off',
  // Replaced by @typescript-eslint/no-empty-function
  /**
   * 2. Enable more idiomatic code
   */
  // Typescript allows const and let instead of var.
  'no-var': 'error',
  'prefer-const': 'warn',
  // The spread operator/rest parameters should be preferred in Typescript.
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
} satisfies OxlintConfig['rules'];
