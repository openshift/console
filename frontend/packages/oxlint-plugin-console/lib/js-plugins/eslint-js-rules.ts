/**
 * ESLint plugin shim for oxlint's `jsPlugins` runtime: re-exports the ESLint
 * core rules that oxlint has not implemented natively, so they run verbatim
 * (identical behavior, options, and severities) inside `yarn oxlint`.
 *
 * Referenced as the `eslint-js` plugin (matching the naming convention of
 * the oxlint-plugin-eslint package, so switching to it later would be
 * drop-in); rules are configured as `eslint-js/<rule-name>`. Only rules
 * WITHOUT a native oxlint implementation belong here — see the package README.
 *
 * The `eslint` package is the source of these rule implementations (and a
 * runtime peer dependency of the other JS plugins); ESLint itself is not
 * used as a linter.
 */

import { builtinRules } from 'eslint/use-at-your-own-risk';

const RULES = [
  'consistent-this',
  'lines-around-directive',
  'lines-between-class-members',
  'no-new-object',
  'no-octal',
  'no-octal-escape',
  'no-restricted-syntax',
  'no-undef-init',
  'spaced-comment',
  'strict',
];

export default {
  meta: { name: 'eslint-js' },
  rules: Object.fromEntries(RULES.map((rule) => [rule, builtinRules.get(rule)])),
};
