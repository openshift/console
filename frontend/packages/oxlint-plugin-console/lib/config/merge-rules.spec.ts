import { mergeRules } from './merge-rules.ts';

describe('mergeRules', () => {
  it('merges options element-wise and retains options a later entry omits', () => {
    expect(
      mergeRules(
        { 'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }] },
        { 'prefer-const': ['error', { destructuring: 'all' }] },
      ),
    ).toEqual({
      'prefer-const': ['error', { destructuring: 'all', ignoreReadBeforeAssign: true }],
    });
  });

  it('treats a severity-only value as a severity override that keeps inherited options', () => {
    expect(
      mergeRules(
        { 'no-use-before-define': ['error', { functions: true, classes: true }] },
        { 'no-use-before-define': 'error' },
      ),
    ).toEqual({ 'no-use-before-define': ['error', { functions: true, classes: true }] });
  });

  it('replaces stale options when an option-bearing value re-enables a disabled rule', () => {
    const result = mergeRules(
      {
        'eslint-js/no-restricted-syntax': [
          'error',
          { selector: 'ForOfStatement' },
          { selector: 'WithStatement' },
        ],
      },
      { 'eslint-js/no-restricted-syntax': 'off' },
      {
        'eslint-js/no-restricted-syntax': [
          'error',
          { selector: "CallExpression[callee.name='useTranslation'][arguments.length=0]" },
        ],
      },
    );
    expect(result).toEqual({
      'eslint-js/no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.name='useTranslation'][arguments.length=0]" },
      ],
    });
  });

  it('does not mutate source dictionaries when a merged result is merged again', () => {
    const source = { rule: ['error', { option: { nested: true } }] };
    const first = mergeRules(source);
    mergeRules(first, { rule: ['error', { other: 1 }] });
    expect(source).toEqual({ rule: ['error', { option: { nested: true } }] });
  });
});
