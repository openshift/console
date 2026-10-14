// Jest's jsdom environment does not provide ResizeObserver.
(global as any).ResizeObserver = class {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
