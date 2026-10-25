import { deserialize, serialize } from 'v8';

// Jest's jsdom environment does not provide the browser's structuredClone API.
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (value) => deserialize(serialize(value));
}
