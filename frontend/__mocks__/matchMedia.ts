if (typeof window.matchMedia !== 'undefined') {
  throw new Error('Hello future me. Remove frontend/__mocks__/matchMedia.ts now please');
}

(window as any).matchMedia = () => ({ matches: true });
