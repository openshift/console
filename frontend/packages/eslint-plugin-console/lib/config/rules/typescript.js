// See https://github.com/typescript-eslint
// See https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin

module.exports = {
  // Require that member overloads be consecutive
  '@typescript-eslint/adjacent-overload-signatures': 'error',

  // Requires using either T[] or Array<T> for arrays
  '@typescript-eslint/array-type': 'error',

  //	Disallows awaiting a value that is not a Thenable
  '@typescript-eslint/await-thenable': 'error',

  // Bans “// @ts-ignore” comments from being used
  '@typescript-eslint/ban-ts-ignore': 'error',

  // Enforces that types will not to be used
  '@typescript-eslint/ban-types': 'error',

  // Enforce camelCase naming convention
  camelcase: 'off',
  '@typescript-eslint/camelcase': 'error',

  // Require PascalCased class and interface names
  '@typescript-eslint/class-name-casing': 'error',

  // Require explicit return types on functions and class methods
  '@typescript-eslint/explicit-function-return-type': 'off',

  // Require explicit accessibility modifiers on class properties and methods
  '@typescript-eslint/explicit-member-accessibility': 'off',

  // Require or disallow spacing between function identifiers and their invocations
  'func-call-spacing': 'off',
  '@typescript-eslint/func-call-spacing': 'error',

  // Enforces naming of generic type variables
  '@typescript-eslint/generic-type-naming': 'off',

  // Enforce consistent indentation
  indent: 'off',
  '@typescript-eslint/indent': ['error', 2],

  // Require that interface names be prefixed with I
  '@typescript-eslint/interface-name-prefix': 'off',

  // Require a specific member delimiter style for interfaces and type literals
  '@typescript-eslint/member-delimiter-style': 'error',

  // Enforces naming conventions for class members by visibility
  '@typescript-eslint/member-naming': 'off',

  // Require a consistent member declaration order
  // FIXME Off for now to figure out how best to utilize this rule
  '@typescript-eslint/member-ordering': 'off',
  // '@typescript-eslint/member-ordering': [
  //   'error',
  //   {
  //     default: [
  //       'public-static-field',
  //       'protected-static-field',
  //       'private-static-field',
  //       'public-static-method',
  //       'protected-static-method',
  //       'private-static-method',
  //       'public-instance-field',
  //       'protected-instance-field',
  //       'private-instance-field',
  //       'constructor',
  //       'public-instance-method',
  //       'protected-instance-method',
  //       'private-instance-method',
  //     ],
  //   },
  // ],

  // TODO This rule wasn't working as expected prior to @typescript-eslint/eslint-plugin v2.11.0.
  // Disabled for now as it is causing failures
  // Enforces the use of as Type assertions instead of <Type> assertions
  // '@typescript-eslint/consistent-type-assertions': [
  //   'error',
  //   {
  //     assertionStyle: 'as',
  //     objectLiteralTypeAssertions: 'allow-as-parameter',
  //   },
  // ],
  '@typescript-eslint/consistent-type-assertions': 'off',

  // Disallow generic Array constructors
  'no-array-constructor': 'off',
  '@typescript-eslint/no-array-constructor': 'error',

  // Disallow the declaration of empty interfaces
  '@typescript-eslint/no-empty-interface': 'error',

  // Disallow usage of the any type
  '@typescript-eslint/no-explicit-any': 'off',

  // Disallow unnecessary parentheses
  'no-extra-parens': 'off',
  '@typescript-eslint/no-extra-parens': 'error',

  // Forbids the use of classes as namespaces
  '@typescript-eslint/no-extraneous-class': 'error',

  // Disallow iterating over an array with a for-in loop
  '@typescript-eslint/no-for-in-array': 'error',

  // TODO This rule wasn't working as expected prior to @typescript-eslint/eslint-plugin v2.11.0.
  // Disabled for now as it is causing failures
  // Disallows explicit type declarations for variables or parameters initialized to a number, string, or boolean
  // '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/no-inferrable-types': 'off',

  // Disallows magic numbers
  'no-magic-numbers': 'off',
  '@typescript-eslint/no-magic-numbers': 'off',

  // Enforce valid definition of new and constructor
  '@typescript-eslint/no-misused-new': 'error',

  // Disallow the use of custom TypeScript modules and namespaces
  '@typescript-eslint/no-namespace': 'off',

  // Disallows non-null assertions using the ! postfix operator
  '@typescript-eslint/no-non-null-assertion': 'error',

  // Disallow the use of parameter properties in class constructors
  '@typescript-eslint/no-parameter-properties': 'off',

  // Disallow the use of parameter properties in class constructors
  '@typescript-eslint/no-require-imports': 'error',

  // Disallow aliasing this
  '@typescript-eslint/no-this-alias': ['error', { allowDestructuring: true }],

  // Disallow /// <reference path='' /> comments
  '@typescript-eslint/triple-slash-reference': [
    'error',
    { path: 'never', types: 'never', lib: 'never' },
  ],

  // Disallow the use of type aliases
  '@typescript-eslint/no-type-alias': 'off',

  // Warns when a namespace qualifier is unnecessary
  '@typescript-eslint/no-unnecessary-qualifier': 'error',

  // Warns if a type assertion does not change the type of an expression
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',

  // Disallow Unused Expressions,
  'no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-expressions': [
    'error',
    { allowShortCircuit: true, allowTernary: true },
  ],

  // Disallow unused variables
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],

  // Disallow the use of variables before they are defined
  'no-use-before-define': 'off',
  '@typescript-eslint/no-use-before-define': 'error',

  // Disallow unnecessary constructors
  'no-useless-constructor': 'off',
  '@typescript-eslint/no-useless-constructor': 'error',

  // Disallows the use of require statements except in import statements
  '@typescript-eslint/no-var-requires': 'error',

  // Prefer a ‘for-of’ loop over a standard ‘for’ loop if the index is only used to access the array being iterated
  '@typescript-eslint/prefer-for-of': 'error',

  // Use function types instead of interfaces with call signatures
  '@typescript-eslint/prefer-function-type': 'error',

  // Enforce includes method over indexOf method
  '@typescript-eslint/prefer-includes': 'error',

  // Prefer an interface declaration over a type literal (type T = { ... })
  '@typescript-eslint/prefer-interface': 'off',

  // Require the use of the namespace keyword instead of the module keyword to declare custom TypeScript modules
  '@typescript-eslint/prefer-namespace-keyword': 'error',

  // Prefer RegExp#exec() over String#match() if no global flag is provided
  '@typescript-eslint/prefer-regexp-exec': 'error',

  // Enforce the use of String#startsWith and String#endsWith instead of other equivalent methods of checking substrings
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',

  // Requires any function or method that returns a Promise to be marked async
  '@typescript-eslint/promise-function-async': 'error',

  // Enforce giving compare argument to Array#sort
  '@typescript-eslint/require-array-sort-compare': 'error',

  // When adding two variables, operands must both be of type number or of type string
  '@typescript-eslint/restrict-plus-operands': 'error',

  // Require or disallow semicolons instead of ASI
  semi: 'off',
  '@typescript-eslint/semi': 'error',

  // Require consistent spacing around type annotations
  '@typescript-eslint/type-annotation-spacing': 'error',

  // Enforces unbound methods are called with their expected scope
  '@typescript-eslint/unbound-method': 'error',

  // Warns for any two overloads that could be unified into one by using a union or an optional/rest parameter
  '@typescript-eslint/unified-signatures': 'error',

  // Covered by 'typescript/member-ordering'
  'sort-class-members/sort-class-members': 'off',

  // Replaces base no-empty-function rule, handling TypeScript code that would otherwise trigger the rule
  '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],

  /**
   * 1. Disable things that are checked by Typescript
   */
  // Checked by Typescript - ts(2378)
  'getter-return': 'off',
  // Checked by Typescript - ts(2300)
  'no-dupe-args': 'off',
  // Checked by Typescript - ts(1117)
  'no-dupe-keys': 'off',
  // Checked by Typescript - ts(7027)
  'no-unreachable': 'off',
  // Checked by Typescript - ts(2367)
  'valid-typeof': 'off',
  // Checked by Typescript - ts(2588)
  'no-const-assign': 'off',
  // Checked by Typescript - ts(2588)
  'no-new-symbol': 'off',
  // Checked by Typescript - ts(2376)
  'no-this-before-super': 'off',
  // This is checked by Typescript using the option `strictNullChecks`.
  'no-undef': 'off',
  // This is already checked by Typescript.
  'no-dupe-class-members': 'off',
  // This is already checked by Typescript.
  'no-redeclare': 'off',
  // Replaced by @typescript-eslint/no-empty-function
  'no-empty-function': 'off',
  /**
   * 2. Enable more idiomatic code
   */
  // Typescript allows const and let instead of var.
  'no-var': 'error',
  'prefer-const': 'error',
  // The spread operator/rest parameters should be preferred in Typescript.
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
};
