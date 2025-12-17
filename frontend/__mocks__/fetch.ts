/* eslint-env node */
import fetch from 'node-fetch';

// Polyfill window.fetch with node-fetch for nock v11 compatibility.
// nock v11 can intercept node-fetch but not jsdom's native fetch.
Object.defineProperty(window, 'fetch', {
  value: fetch,
  writable: true,
});
