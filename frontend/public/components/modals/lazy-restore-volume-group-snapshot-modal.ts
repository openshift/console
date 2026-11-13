import { lazy } from 'react';

export const LazyRestoreVolumeGroupSnapshotModalOverlay = lazy(() =>
  import(
    '@console/app/src/components/modals/restore-pvc/restore-volume-group-snapshot-modal' /* webpackChunkName: "restore-volume-group-snapshot-modal" */
  ).then((m) => ({ default: m.RestoreVolumeGroupSnapshotModalOverlay })),
);
