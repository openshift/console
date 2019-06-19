const merge = require('merge');

module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.tsx'],

      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },

      // TODO update to new parser https://github.com/prettier/prettier-eslint/issues/201 is fixed
      // parser: '@typescript-eslint/parser',
      parser: 'typescript-eslint-parser',

      plugins: ['@typescript-eslint'],

      settings: {
        'import/parsers': {
          'typescript-eslint-parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
          typescript: {},
        },
      },

      rules: merge(require('./rules/typescript'), {
        // Performance issues with using `project` and specific rules with new parser:
        // https://github.com/typescript-eslint/typescript-eslint/issues/389
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/no-for-in-array': 'off',
        '@typescript-eslint/no-unnecessary-qualifier': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/prefer-includes': 'off',
        '@typescript-eslint/prefer-regexp-exec': 'off',
        '@typescript-eslint/prefer-string-starts-ends-with': 'off',
        '@typescript-eslint/promise-function-async': 'off',
        '@typescript-eslint/require-array-sort-compare': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        '@typescript-eslint/unbound-method': 'off',
      }),
    },
    {
      files: ['*.tsx'],
      rules: {
        // Require a consistent member declaration order
        // Off due to conflict with react ordering
        '@typescript-eslint/member-ordering': 'off',
      },
    },
  ],
};
