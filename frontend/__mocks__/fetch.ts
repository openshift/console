import { fetch, Request, Response } from 'undici';

// jsdom does not implement the fetch API. Polyfill it with undici so that
// tests can use fetch and nock can intercept the requests. fetch, Request
// and Response are polyfilled from the same implementation since clients
// such as @gitbeaker/rest construct Requests and nock creates Responses
// from the globals. Headers is not polyfilled: jsdom provides it natively
// and it interops with undici's fetch and Request as a HeadersInit.

if (
  typeof window.fetch !== 'undefined' ||
  typeof window.Request !== 'undefined' ||
  typeof window.Response !== 'undefined'
) {
  throw new Error('Hello future me. Remove frontend/__mocks__/fetch.ts now please');
}

Object.defineProperty(window, 'fetch', {
  value: fetch,
  writable: true,
  configurable: true,
});
Object.defineProperty(window, 'Request', {
  value: Request,
  writable: true,
  configurable: true,
});
Object.defineProperty(window, 'Response', {
  value: Response,
  writable: true,
  configurable: true,
});
