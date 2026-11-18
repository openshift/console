import type { OxlintConfig } from 'oxlint';

// See https://github.com/facebook/react/tree/master/packages/eslint-plugin-react-hooks

export default {
  // Only use Hooks at the top level of a React functional component or from within another custom hook.
  'react-hooks-js/rules-of-hooks': 'error',
  // Checks for missing useEffect dependencies
  'react-hooks-js/exhaustive-deps': 'error',

  // React Compiler rules
  'react-hooks-js/error-boundaries': 'error',
  'react-hooks-js/globals': 'error',
  'react-hooks-js/immutability': 'warn',
  'react-hooks-js/preserve-manual-memoization': 'warn',
  'react-hooks-js/purity': 'warn',
  'react-hooks-js/refs': 'warn',
  'react-hooks-js/set-state-in-effect': 'warn',
  'react-hooks-js/set-state-in-render': 'warn',
  'react-hooks-js/static-components': 'warn',
  'react-hooks-js/unsupported-syntax': 'error',
  'react-hooks-js/use-memo': 'warn',
  'react-hooks-js/incompatible-library': 'error',
} satisfies OxlintConfig['rules'];
