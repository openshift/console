// See https://github.com/facebook/react/tree/master/packages/eslint-plugin-react-hooks

module.exports = {
  // Only use Hooks at the top level of a React functional component or from within another custom hook.
  'react-hooks/rules-of-hooks': 'error',
  // Checks for missing useEffect dependencies
  'react-hooks/exhaustive-deps': 'error',

  // React Compiler rules
  'react-hooks/config': 'error',
  'react-hooks/error-boundaries': 'error',
  'react-hooks/gating': 'error',
  'react-hooks/globals': 'error',
  'react-hooks/immutability': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/refs': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/set-state-in-render': 'warn',
  'react-hooks/static-components': 'warn',
  'react-hooks/unsupported-syntax': 'error',
  'react-hooks/use-memo': 'warn',
  'react-hooks/incompatible-library': 'error',
};
