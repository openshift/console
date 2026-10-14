// see http://eslint.org/docs/rules/#nodejs and https://github.com/eslint-community/eslint-plugin-n

module.exports = {
  // Enforce return after a callback
  'n/callback-return': ['error', ['callback', 'cb', 'next']],
  // Disallow require() outside of the top-level module scope
  'n/global-require': 'off',
  // Enforces error handling in callbacks
  'n/handle-callback-err': ['error', '^.*(e|E)rr(or)?$'],
  // Disallow mixing regular variable and require declarations
  'n/no-mixed-requires': 'off',
  // Disallow use of new operator with the require function
  'n/no-new-require': 'error',
  // Disallow string concatenation with __dirname and __filename
  'n/no-path-concat': 'error',
  // Disallow process.exit()
  'n/no-process-exit': 'off',
  // Restrict usage of specified node imports
  'no-restricted-imports': 'off',
  // Disallow use of synchronous methods
  'n/no-sync': 'off',
  // Disallow import declarations of extraneous packages
  // defer to import/no-extraneous-dependencies
  'n/no-extraneous-import': 'off',
  // Disallow require() expressions of extraneous packages
  // defer to import/no-extraneous-dependencies
  'n/no-extraneous-require': 'error',
  // Enforce either module.exports or exports.
  'n/exports-style': ['error', 'module.exports'],
  // enforce either Buffer or require("buffer").Buffer
  'n/prefer-global/buffer': 'error',
  //	enforce either console or require("console")
  'n/prefer-global/console': 'error',
  // enforce either process or require("process")
  'n/prefer-global/process': 'error',
  // enforce either TextDecoder or require("util").TextDecoder
  'n/prefer-global/text-decoder': 'error',
  // enforce either TextEncoder or require("util").TextEncoder
  'n/prefer-global/text-encoder': 'error',
  // enforce either URLSearchParams or require("url").URLSearchParams
  'n/prefer-global/url-search-params': 'error',
  // enforce either URL or require("url").URL
  'n/prefer-global/url': 'error',
  // Disallow deprecated API.
  'n/no-deprecated-api': 'error',
  // Disallow import and export declarations for files that don't exist.
  'n/no-missing-import': 'off',
  // Disallow require()s for files that don't exist.
  'n/no-missing-require': 'off',
  // Disallow import and export declarations for files that are not published.
  'n/no-unpublished-import': 'off',
  // Disallow bin files that npm ignores.
  'n/no-unpublished-bin': 'error',
  // Disallow require()s for files that are not published.
  'n/no-unpublished-require': 'off',
  // disallow unsupported ECMAScript built-ins on the specified version
  'n/no-unsupported-features/es-builtins': 'off',
  // disallow unsupported ECMAScript syntax on the specified version
  'n/no-unsupported-features/es-syntax': 'off',
  // disallow unsupported Node.js built-in APIs on the specified version
  'n/no-unsupported-features/node-builtins': 'error',
  // If you turn this rule on, ESLint comes to address process.exit() as throw in code path analysis.
  'n/process-exit-as-throw': 'off',
  // Suggest correct usage of shebang.
  'n/hashbang': 'error',
  // disallows callback API in favor of promise API for dns module
  'n/prefer-promises/dns': 'error',
  // disallows callback API in favor of promise API for fs module
  'n/prefer-promises/fs': 'error',
  // Disallow expressions in require()
  'import/no-dynamic-require': 'off',
};
