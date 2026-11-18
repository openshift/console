// jsdom does not provide the web streams API, which is required by
// @mswjs/interceptors / nock >= 14 (fetch interception, response creation
// and decompression).

import {
  CompressionStream,
  DecompressionStream,
  ReadableStream,
  TransformStream,
} from 'node:stream/web';

if (
  typeof globalThis.TransformStream !== 'undefined' ||
  typeof globalThis.ReadableStream !== 'undefined' ||
  typeof globalThis.DecompressionStream !== 'undefined'
) {
  throw new Error('Hello future me. Remove frontend/__mocks__/transformStream.ts now please');
}

Object.assign(globalThis, {
  CompressionStream,
  DecompressionStream,
  ReadableStream,
  TransformStream,
});
