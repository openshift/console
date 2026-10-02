const { createTransformer } = require('@swc/jest');

const swcTransformer = createTransformer({
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    transform: {
      react: {
        runtime: 'automatic',
      },
    },
  },
  module: {
    type: 'commonjs',
    noInterop: false,
  },
});

const transformImportMetaHot = (source) => source.replace(/import\.meta\.hot/g, 'false');

/** @type {import('@jest/transform').SyncTransformer} */
module.exports = {
  canInstrument: swcTransformer.canInstrument,
  process(source, filename, options) {
    return swcTransformer.process(transformImportMetaHot(source), filename, options);
  },
  getCacheKey(source, filename, ...args) {
    return swcTransformer.getCacheKey(transformImportMetaHot(source), filename, ...args);
  },
};
