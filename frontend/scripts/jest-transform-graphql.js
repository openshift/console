/* eslint-disable tsdoc/syntax */ // This file is written in JavaScript, so we use JSDoc here. TSDoc rules don't apply
// @ts-check
/**
 * graphql-tag loader for Webpack lets you keep GraphQL queries in separate files.
 *
 * This file makes those work in Jest.
 *
 * Copied from https://github.com/remind101/jest-transform-graphql
 *
 * @license MIT
 */
const loader = require('graphql-tag/loader');

/** @type {import('@jest/transform').SyncTransformer} */
module.exports = {
  process(src) {
    // call directly the webpack loader with a mocked context
    // as graphql-tag/loader leverages `this.cacheable()`
    return {
      code: loader.call({ cacheable() {} }, src),
    };
  },
};
