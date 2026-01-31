import { lazy } from 'react';

// Lazy-loaded OverlayComponent for Resource Limits Modal
export const LazyResourceLimitsModalOverlay = lazy(() =>
  import('./ResourceLimitsModalLauncher' /* webpackChunkName: "resource-limits-modal" */).then(
    (m) => ({
      default: m.ResourceLimitsModalOverlay,
    }),
  ),
);
