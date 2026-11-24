import type { OxlintConfig } from 'oxlint';
import { mergeRules } from './merge-rules.ts';
import rules from './rules/typescript.ts';

// TypeScript preset (native typescript plugin rules). The
// performance-related rules are disabled (they require type information):
// https://github.com/typescript-eslint/typescript-eslint/issues/389
const preset: OxlintConfig = {
  plugins: ['typescript'],

  rules: mergeRules(rules, {
    'typescript/await-thenable': 'off',
    'typescript/no-for-in-array': 'off',
    'typescript/no-unnecessary-qualifier': 'off',
    'typescript/no-unnecessary-type-assertion': 'off',
    'typescript/prefer-includes': 'off',
    'typescript/prefer-regexp-exec': 'off',
    'typescript/prefer-string-starts-ends-with': 'off',
    'typescript/promise-function-async': 'off',
    'typescript/require-array-sort-compare': 'off',
    'typescript/restrict-plus-operands': 'off',
    'typescript/unbound-method': 'off',
  }),
};

export default preset;
