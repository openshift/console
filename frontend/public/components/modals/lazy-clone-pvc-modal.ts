import { lazy } from 'react';

export const LazyClonePVCModalOverlay = lazy(() =>
  import(
    '@console/app/src/components/modals/clone/clone-pvc-modal' /* webpackChunkName: "clone-pvc-modal" */
  ).then((m) => ({ default: m.ClonePVCModalOverlay })),
);
