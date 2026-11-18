if (typeof global.ResizeObserver !== 'undefined') {
  throw new Error('Hello future me. Remove frontend/__mocks__/resizeObserver.ts now please');
}

// Jest's jsdom environment does not provide ResizeObserver.
(global as any).ResizeObserver = class {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
