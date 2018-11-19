/* eslint-disable no-undef */

import { addAlias } from 'module-alias';

// The `lodash-es` package ships code that uses ECMAScript modules. Since `ts-node`
// excludes everything under `node_modules` directory from compilation, attempting
// to import `lodash-es` code yields syntax errors.
//
// Integration tests already use the `lodash` package, so we simply register alias
// to `lodash` in context of Node.js module resolution mechanism.

addAlias('lodash-es', 'lodash');

declare global {
  interface window {
    SERVER_FLAGS: object;
  }
}

(global as any).window = {
  SERVER_FLAGS: {
    basePath: '/',
  },
};
