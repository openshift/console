import { lazy } from 'react';

export const LazyDeleteHPAModalOverlay = lazy(() =>
  import('./DeleteHPAModal' /* webpackChunkName: "delete-hpa-modal" */).then((m) => ({
    default: m.DeleteHPAModalOverlay,
  })),
);
