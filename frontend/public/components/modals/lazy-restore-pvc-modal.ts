import { lazy } from 'react';

export const LazyRestorePVCModalOverlay = lazy(() =>
  import(
    '@console/app/src/components/modals/restore-pvc/restore-pvc-modal' /* webpackChunkName: "restore-pvc-modal" */
  ).then((m) => ({ default: m.RestorePVCModalOverlay })),
);
