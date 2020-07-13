import { VolumeSnapshotKind } from '@console/internal/module/k8s';

export const volumeSnapshotStatus = ({ status }: { status: VolumeSnapshotKind['status'] }) => {
  const readyToUse = status?.readyToUse;
  const isError = !!status?.error?.message;
  return readyToUse ? 'Ready' : isError ? 'Error' : 'Pending';
};
