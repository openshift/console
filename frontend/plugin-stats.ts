/* eslint-env node */

import {
  resolvePluginPackages,
  loadActivePlugins,
  printPluginStats,
} from '@console/plugin-sdk/src/codegen';

// Prevent ts-node from processing additional assets such as stylesheets.
// https://github.com/TypeStrong/ts-node/issues/175#issuecomment-455429261
['.css', '.scss'].forEach(ext => {
  require.extensions[ext] = () => undefined;
});

printPluginStats(loadActivePlugins(resolvePluginPackages()));
