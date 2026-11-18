import { deserialize, serialize } from 'v8';

// Jest's jsdom environment does not provide the browser's structuredClone API.
if (typeof global.structuredClone !== 'undefined') {
  throw new Error('Hello future me. Remove frontend/__mocks__/structuredClone.ts now please');
}

global.structuredClone = (value) => deserialize(serialize(value));
