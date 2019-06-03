// see https://github.com/xjamundx/eslint-plugin-promise

module.exports = {
  // Promise Rules

  // Enforces the use of catch() on un-returned promises.
  'promise/catch-or-return': 'error',
  // Avoid wrapping values in Promise.resolve or Promise.reject when not needed.
  'promise/no-return-wrap': 'error',
  // Enforce consistent param names and ordering when creating new promises.
  'promise/param-names': 'off',
  // Return inside each then() to create readable and reusable Promise chains.
  'promise/always-return': 'off',
  // In an ES5 environment, make sure to create a Promise constructor before using.
  'promise/no-native': 'off',
  // Avoid nested .then() or .catch() statements
  'promise/no-nesting': 'error',
  // Avoid using promises inside of callbacks
  'promise/no-promise-in-callback': 'off',
  // Avoid calling cb() inside of a then() (use nodeify instead)
  'promise/no-callback-in-promise': 'off',
  // Avoid creating new promises outside of utility libs (use pify instead)
  'promise/avoid-new': 'off',
  // Avoid calling new on a Promise static method
  'promise/no-new-statics': 'error',
  // Disallow return statements in finally()
  'promise/no-return-in-finally': 'error',
  // Ensures the proper number of arguments are passed to Promise functions
  'promise/valid-params': 'error',

  // Async/Await Rules

  // Prefer await to then() for reading Promise values
  'promise/prefer-await-to-then': 'off',
  // Prefer async/await to the callback pattern
  'promise/prefer-await-to-callbacks': 'off',
};
