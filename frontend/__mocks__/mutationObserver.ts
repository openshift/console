/* eslint-disable */

// Jest's jsdom environment does not provide MutationObserver.
(global as any).MutationObserver = class {
  constructor(callback: unknown) {}
  disconnect() {}
  observe(element: unknown, initObject: unknown) {}
};
