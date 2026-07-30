import { lazy } from 'react';

// Lazy-loaded OverlayComponent for DeleteResourceModal
export const LazyDeleteResourceModalOverlay = lazy(() =>
  import('./DeleteResourceModal' /* webpackChunkName: "shared-modals" */).then((m) => ({
    default: m.DeleteResourceModalOverlay,
  })),
);
