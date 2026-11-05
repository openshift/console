import { fetch, Headers, Request, Response } from 'undici';

// jsdom does not implement the fetch API. Polyfill it with undici so that
// tests can use fetch and nock can intercept the requests. The full surface
// (fetch, Request, Response, Headers) is polyfilled from the same
// implementation since clients such as @gitbeaker/rest construct Requests
// and nock creates Responses from the globals.
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
Object.defineProperty(window, 'Headers', {
  value: Headers,
  writable: true,
  configurable: true,
});
