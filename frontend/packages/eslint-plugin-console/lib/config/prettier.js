const merge = require('merge');

module.exports = {
  extends: ['prettier', 'prettier/react'],

  plugins: ['prettier'],

  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        jsxBracketSameLine: false,
        arrowParens: 'always',
        printWidth: 100,
        semi: true,
        useTabs: false,
      },
      {
        usePrettierrc: false,
      },
    ],
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: merge(require('./rules/prettier-typescript'), {
        'prettier/prettier': [
          'error',
          {
            parser: 'typescript',
            singleQuote: true,
            trailingComma: 'all',
            bracketSpacing: true,
            jsxBracketSameLine: false,
            arrowParens: 'always',
            printWidth: 100,
          },
          {
            usePrettierrc: false,
          },
        ],
      }),
    },
  ],
};
