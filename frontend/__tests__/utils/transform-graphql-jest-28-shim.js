/**
 * A fix for this error:
 *
 *  ● Invalid return value:
 *    `process()` or/and `processAsync()` method of code transformer found at
 *    "console/frontend/node_modules/jest-transform-graphql/index.js"
 *    should return an object or a Promise resolving to an object. The object
 *    must have `code` property with a string of processed code.
 *    This error may be caused by a breaking change in Jest 28:
 *    https://jestjs.io/docs/28.x/upgrading-to-jest28#transformer
 *    Code Transformation Documentation:
 *    https://jestjs.io/docs/code-transformation
 *
 * See https://github.com/remind101/jest-transform-graphql/issues/13
 */

const { process: upstreamProcess } = require('jest-transform-graphql');

const process = (...args) => {
  const code = upstreamProcess(...args);
  return { code };
};

module.exports = { process };
