/* eslint-env node */

require('ts-node').register({
  typeCheck: false,
  compilerOptions: {
    ...require('./tsconfig.json').compilerOptions,
    module: 'commonjs',
  },
  ignore: [
    /node_modules\/(?!lodash-es|@console|@spice-project)/,
  ],
});

// When an extension is unknown to Node.js, ts-node handles the file as ".js".
// https://github.com/TypeStrong/ts-node/issues/175#issuecomment-455429261
['.css', '.scss'].forEach(ext => {
  require.extensions[ext] = () => undefined;
});

// Assume test environment for the purpose of Console plugin stat reporting.
process.env.NODE_ENV = 'test';

require('browser-env')({ url: 'http://localhost' });
require('./__mocks__/matchMedia');
require('./__mocks__/serverFlags');

const {
  resolvePluginPackages,
  loadActivePlugins,
  printPluginStats,
} = require('@console/plugin-sdk/src/codegen');

printPluginStats(loadActivePlugins(resolvePluginPackages()));
