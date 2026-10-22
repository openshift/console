import type { OxlintConfig } from 'oxlint';

// airbnb-base defaults, materialized from eslint-config-airbnb-base@15.0.0
// so that every rule is explicit and runs under oxlint. Rules that oxlint
// does not implement natively run via JS plugins under their aliased
// prefixes: no-new-require/no-path-concat -> n/*, no-buffer-constructor ->
// unicorn/no-new-buffer, no-octal & co. -> eslint-js/*, import/order & co.
// -> import-js/*, dot-notation/no-return-await -> typescript/*. The
// console's tweaks live in airbnb-base-overrides.ts; promise rules in
// promise.ts.
export default {
  'accessor-pairs': 'off',
  'array-callback-return': [
    'error',
    {
      allowImplicit: true,
    },
  ],
  'block-scoped-var': 'error',
  complexity: ['off', 20],
  'class-methods-use-this': [
    'error',
    {
      exceptMethods: [],
    },
  ],
  curly: ['error', 'multi-line'],
  'default-case': [
    'error',
    {
      commentPattern: '^no default$',
    },
  ],
  'default-case-last': 'error',
  'default-param-last': 'error',
  'typescript/dot-notation': [
    'error',
    {
      allowKeywords: true,
    },
  ],
  eqeqeq: [
    'error',
    'always',
    {
      null: 'ignore',
    },
  ],
  'grouped-accessor-pairs': 'error',
  'guard-for-in': 'error',
  'max-classes-per-file': ['error', 1],
  'no-alert': 'warn',
  'no-caller': 'error',
  'no-case-declarations': 'error',
  'no-constructor-return': 'error',
  'no-div-regex': 'off',
  'no-else-return': [
    'error',
    {
      allowElseIf: false,
    },
  ],
  'no-empty-function': [
    'error',
    {
      allow: ['arrowFunctions', 'functions', 'methods'],
    },
  ],
  'no-empty-pattern': 'error',
  'no-eq-null': 'off',
  'no-eval': 'error',
  'no-extend-native': 'error',
  'no-extra-bind': 'error',
  'no-extra-label': 'error',
  'no-fallthrough': 'error',
  'no-global-assign': [
    'error',
    {
      exceptions: [],
    },
  ],
  'no-implicit-coercion': [
    'off',
    {
      boolean: false,
      number: true,
      string: true,
      allow: [],
    },
  ],
  'no-implicit-globals': 'off',
  'no-implied-eval': 'error',
  'no-iterator': 'error',
  'no-labels': [
    'error',
    {
      allowLoop: false,
      allowSwitch: false,
    },
  ],
  'no-lone-blocks': 'error',
  'no-loop-func': 'error',
  'no-magic-numbers': [
    'off',
    {
      ignore: [],
      ignoreArrayIndexes: true,
      enforceConst: true,
      detectObjects: false,
    },
  ],
  'no-multi-str': 'error',
  'no-new': 'error',
  'no-new-func': 'error',
  'no-new-wrappers': 'error',
  'no-nonoctal-decimal-escape': 'error',
  'eslint-js/no-octal': 'error',
  'eslint-js/no-octal-escape': 'error',
  'no-param-reassign': [
    'error',
    {
      props: true,
      ignorePropertyModificationsFor: [
        'acc',
        'accumulator',
        'e',
        'ctx',
        'context',
        'req',
        'request',
        'res',
        'response',
        '$scope',
        'staticContext',
      ],
    },
  ],
  'no-proto': 'error',
  'no-redeclare': 'error',
  'no-restricted-properties': [
    'error',
    {
      object: 'arguments',
      property: 'callee',
      message: 'arguments.callee is deprecated',
    },
    {
      object: 'global',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    },
    {
      object: 'self',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    },
    {
      object: 'window',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    },
    {
      object: 'global',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    },
    {
      object: 'self',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    },
    {
      object: 'window',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    },
    {
      property: '__defineGetter__',
      message: 'Please use Object.defineProperty instead.',
    },
    {
      property: '__defineSetter__',
      message: 'Please use Object.defineProperty instead.',
    },
    {
      object: 'Math',
      property: 'pow',
      message: 'Use the exponentiation operator (**) instead.',
    },
  ],
  'no-return-assign': ['error', 'always'],
  'typescript/return-await': 'error',
  'no-script-url': 'error',
  'no-self-assign': [
    'error',
    {
      props: true,
    },
  ],
  'no-self-compare': 'error',
  'no-sequences': 'error',
  'no-throw-literal': 'error',
  'no-unmodified-loop-condition': 'off',
  'no-unused-expressions': [
    'error',
    {
      allowShortCircuit: false,
      allowTernary: false,
      allowTaggedTemplates: false,
    },
  ],
  'no-unused-labels': 'error',
  'no-useless-call': 'off',
  'no-useless-catch': 'error',
  'no-useless-concat': 'error',
  'no-useless-escape': 'error',
  'no-useless-return': 'error',
  'no-void': 'error',
  'no-warning-comments': [
    'off',
    {
      terms: ['todo', 'fixme', 'xxx'],
      location: 'start',
    },
  ],
  'no-with': 'error',
  'prefer-promise-reject-errors': [
    'error',
    {
      allowEmptyReject: true,
    },
  ],
  'prefer-named-capture-group': 'off',
  'prefer-regex-literals': [
    'error',
    {
      disallowRedundantWrapping: true,
    },
  ],
  radix: 'error',
  'require-await': 'off',
  'require-unicode-regexp': 'off',
  'vars-on-top': 'error',
  yoda: 'error',
  'for-direction': 'error',
  'getter-return': [
    'error',
    {
      allowImplicit: true,
    },
  ],
  'no-async-promise-executor': 'error',
  'no-await-in-loop': 'error',
  'no-compare-neg-zero': 'error',
  'no-cond-assign': ['error', 'always'],
  'no-console': 'warn',
  'no-constant-condition': 'warn',
  'no-control-regex': 'error',
  'no-debugger': 'error',
  'no-dupe-else-if': 'error',
  'no-dupe-keys': 'error',
  'no-duplicate-case': 'error',
  'no-empty': 'error',
  'no-empty-character-class': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-func-assign': 'error',
  'no-import-assign': 'error',
  'no-inner-declarations': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-loss-of-precision': 'error',
  'no-misleading-character-class': 'error',
  'no-obj-calls': 'error',
  'no-promise-executor-return': 'error',
  'no-prototype-builtins': 'error',
  'no-regex-spaces': 'error',
  'no-setter-return': 'error',
  'no-sparse-arrays': 'error',
  'no-template-curly-in-string': 'error',
  'no-unexpected-multiline': 'error',
  'no-unreachable': 'error',
  'no-unreachable-loop': [
    'error',
    {
      ignore: [],
    },
  ],
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'no-unsafe-optional-chaining': [
    'error',
    {
      disallowArithmeticOperators: true,
    },
  ],
  'no-unused-private-class-members': 'off',
  'no-useless-backreference': 'error',
  'use-isnan': 'error',
  'valid-typeof': [
    'error',
    {
      requireStringLiterals: true,
    },
  ],
  'unicorn/no-new-buffer': 'error',
  'n/no-new-require': 'error',
  'n/no-path-concat': 'error',
  'capitalized-comments': [
    'off',
    'never',
    {
      line: {
        ignorePattern: '.*',
        ignoreInlineComments: true,
        ignoreConsecutiveComments: true,
      },
      block: {
        ignorePattern: '.*',
        ignoreInlineComments: true,
        ignoreConsecutiveComments: true,
      },
    },
  ],
  'eslint-js/consistent-this': 'off',
  'func-name-matching': [
    'off',
    'always',
    {
      includeCommonJSModuleExports: false,
      considerPropertyDescriptor: true,
    },
  ],
  'func-names': 'warn',
  'func-style': ['off', 'expression'],
  'id-denylist': 'off',
  'id-length': 'off',
  'id-match': 'off',
  'eslint-js/lines-between-class-members': [
    'error',
    'always',
    {
      exceptAfterSingleLine: false,
    },
  ],
  'eslint-js/lines-around-directive': [
    'error',
    {
      before: 'always',
      after: 'always',
    },
  ],
  'max-depth': ['off', 4],
  'max-lines': [
    'off',
    {
      max: 300,
      skipBlankLines: true,
      skipComments: true,
    },
  ],
  'max-lines-per-function': [
    'off',
    {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: true,
    },
  ],
  'max-nested-callbacks': 'off',
  'max-params': ['off', 3],
  'max-statements': ['off', 10],
  'new-cap': [
    'error',
    {
      newIsCap: true,
      newIsCapExceptions: [],
      capIsNew: false,
      capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List'],
    },
  ],
  'no-array-constructor': 'error',
  'no-bitwise': 'error',
  'no-continue': 'error',
  'no-inline-comments': 'off',
  'no-lonely-if': 'error',
  'no-multi-assign': ['error'],
  'no-negated-condition': 'off',
  'no-nested-ternary': 'error',
  'eslint-js/no-new-object': 'error',
  'no-plusplus': 'error',
  'eslint-js/no-restricted-syntax': [
    'error',
    {
      selector: 'ForInStatement',
      message:
        'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
    },
    {
      selector: 'ForOfStatement',
      message:
        'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
    },
    {
      selector: 'LabeledStatement',
      message:
        'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
    },
    {
      selector: 'WithStatement',
      message:
        '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
    },
  ],
  'no-ternary': 'off',
  'no-underscore-dangle': [
    'error',
    {
      allow: [],
      allowAfterThis: false,
      allowAfterSuper: false,
      enforceInMethodNames: true,
    },
  ],
  'no-unneeded-ternary': [
    'error',
    {
      defaultAssignment: false,
    },
  ],
  'one-var': ['error', 'never'],
  'operator-assignment': ['error', 'always'],
  'prefer-exponentiation-operator': 'error',
  'prefer-object-spread': 'error',
  'sort-keys': [
    'off',
    'asc',
    {
      caseSensitive: false,
      natural: true,
    },
  ],
  'sort-vars': 'off',
  'eslint-js/spaced-comment': [
    'error',
    'always',
    {
      line: {
        exceptions: ['-', '+'],
        markers: ['=', '!', '/'],
      },
      block: {
        exceptions: ['-', '+'],
        markers: ['=', '!', ':', '::'],
        balanced: true,
      },
    },
  ],
  'unicode-bom': ['error', 'never'],
  'init-declarations': 'off',
  'no-delete-var': 'error',
  'no-label-var': 'error',
  'no-restricted-globals': [
    'error',
    {
      name: 'isFinite',
      message:
        'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
    },
    {
      name: 'isNaN',
      message:
        'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
    },
    'addEventListener',
    'blur',
    'close',
    'closed',
    'confirm',
    'defaultStatus',
    'defaultstatus',
    'event',
    'external',
    'find',
    'focus',
    'frameElement',
    'frames',
    'history',
    'innerHeight',
    'innerWidth',
    'length',
    'location',
    'locationbar',
    'menubar',
    'moveBy',
    'moveTo',
    'name',
    'onblur',
    'onerror',
    'onfocus',
    'onload',
    'onresize',
    'onunload',
    'open',
    'opener',
    'opera',
    'outerHeight',
    'outerWidth',
    'pageXOffset',
    'pageYOffset',
    'parent',
    'print',
    'removeEventListener',
    'resizeBy',
    'resizeTo',
    'screen',
    'screenLeft',
    'screenTop',
    'screenX',
    'screenY',
    'scroll',
    'scrollbars',
    'scrollBy',
    'scrollTo',
    'scrollX',
    'scrollY',
    'self',
    'status',
    'statusbar',
    'stop',
    'toolbar',
    'top',
  ],
  'no-shadow': 'error',
  'no-shadow-restricted-names': 'error',
  'no-undef': 'error',
  'eslint-js/no-undef-init': 'error',
  'no-undefined': 'off',
  'no-unused-vars': [
    'error',
    {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
    },
  ],
  'no-use-before-define': [
    'error',
    {
      functions: true,
      classes: true,
      variables: true,
    },
  ],
  'arrow-body-style': [
    'error',
    'as-needed',
    {
      requireReturnForObjectLiteral: false,
    },
  ],
  'constructor-super': 'error',
  'no-class-assign': 'error',
  'no-const-assign': 'error',
  'no-dupe-class-members': 'error',
  'no-duplicate-imports': 'off',
  'no-restricted-exports': [
    'error',
    {
      restrictedNamedExports: ['default', 'then'],
    },
  ],
  'no-restricted-imports': [
    'off',
    {
      paths: [],
      patterns: [],
    },
  ],
  'no-this-before-super': 'error',
  'no-useless-computed-key': 'error',
  'no-useless-constructor': 'error',
  'no-useless-rename': [
    'error',
    {
      ignoreDestructuring: false,
      ignoreImport: false,
      ignoreExport: false,
    },
  ],
  'no-var': 'error',
  'object-shorthand': [
    'error',
    'always',
    {
      ignoreConstructors: false,
      avoidQuotes: true,
    },
  ],
  'prefer-arrow-callback': [
    'error',
    {
      allowNamedFunctions: false,
      allowUnboundThis: true,
    },
  ],
  'prefer-const': [
    'error',
    {
      destructuring: 'any',
      ignoreReadBeforeAssign: true,
    },
  ],
  'prefer-destructuring': [
    'error',
    {
      VariableDeclarator: {
        array: false,
        object: true,
      },
      AssignmentExpression: {
        array: true,
        object: false,
      },
    },
    {
      enforceForRenamedProperties: false,
    },
  ],
  'prefer-numeric-literals': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'prefer-template': 'error',
  'require-yield': 'error',
  'sort-imports': [
    'off',
    {
      ignoreCase: false,
      ignoreDeclarationSort: false,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    },
  ],
  'symbol-description': 'error',
  'import-js/no-unresolved': [
    'error',
    {
      commonjs: true,
      caseSensitive: true,
    },
  ],
  'import/named': 'error',
  'import/default': 'off',
  'import/namespace': 'off',
  // Warning rather than error: oxlint over-reports here (see the package README).
  'import/export': 'warn',
  'import/no-named-as-default': 'error',
  // Warning rather than error: oxlint over-reports here (see the package README).
  'import/no-named-as-default-member': 'warn',
  'import/no-mutable-exports': 'error',
  'import/no-commonjs': 'off',
  'import/no-amd': 'error',
  'import/no-nodejs-modules': 'off',
  'import/first': 'error',
  'import/no-duplicates': 'error',
  'import/no-namespace': 'off',
  'import/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
    },
  ],
  'import-js/order': [
    'error',
    {
      groups: [['builtin', 'external', 'internal']],
    },
  ],
  'import/newline-after-import': 'error',
  'import/prefer-default-export': 'error',
  'import/max-dependencies': [
    'off',
    {
      max: 10,
    },
  ],
  'import/no-absolute-path': 'error',
  'import/no-dynamic-require': 'error',
  'import/unambiguous': 'off',
  'import/no-webpack-loader-syntax': 'error',
  'import/no-unassigned-import': 'off',
  'import/no-named-default': 'error',
  'import/no-anonymous-default-export': [
    'off',
    {
      allowArray: false,
      allowArrowFunction: false,
      allowAnonymousClass: false,
      allowAnonymousFunction: false,
      allowLiteral: false,
      allowObject: false,
    },
  ],
  'import/exports-last': 'off',
  'import/group-exports': 'off',
  'import/no-default-export': 'off',
  'import/no-named-export': 'off',
  'import/no-self-import': 'error',
  'import/no-cycle': [
    'error',
    {
      maxDepth: 4294967295,
    },
  ],
  'import-js/no-useless-path-segments': [
    'error',
    {
      commonjs: true,
    },
  ],
  'import/no-relative-parent-imports': 'off',
  'import-js/no-import-module-exports': [
    'error',
    {
      exceptions: [],
    },
  ],
  'import-js/no-relative-packages': 'error',
  'eslint-js/strict': ['error', 'never'],
} satisfies OxlintConfig['rules'];
