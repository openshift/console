import { lazy } from 'react';

// Lazy-loaded OverlayComponent for Configure Unschedulable Modal
export const LazyConfigureUnschedulableModalOverlay = lazy(() =>
  import(
    './ConfigureUnschedulableModal' /* webpackChunkName: "configure-unschedulable-modal" */
  ).then((m) => ({
    default: m.ConfigureUnschedulableModalOverlay,
  })),
);
