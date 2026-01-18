// See https://github.com/jsdom/jsdom/issues/2524

import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder !== 'undefined' || typeof global.TextDecoder !== 'undefined') {
  throw new Error('Hello future me. Remove frontend/__mocks__/textEncoderDecoder.ts now please');
}

Object.assign(global, { TextDecoder, TextEncoder });
