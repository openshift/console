import { lazy } from 'react';

export { DeleteHPAModalOverlay } from './DeleteHPAModal';

// Lazy-loaded OverlayComponent for DeleteHPAModal
export const LazyDeleteHPAModalOverlay = lazy(() =>
  import('./DeleteHPAModal' /* webpackChunkName: "delete-hpa-modal" */).then((m) => ({
    default: m.DeleteHPAModalOverlay,
  })),
);