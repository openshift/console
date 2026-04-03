import { convertToBaseValue } from '@console/internal/components/utils/units';
import type {
  VolumeSnapshotContentKind,
  VolumeSnapshotKind,
  VolumeSnapshotStatus,
} from '@console/internal/module/k8s';

export const snapshotStatus = ({ status }: { status?: VolumeSnapshotStatus }): string => {
  const readyToUse = status?.readyToUse;
  const isError = !!status?.error?.message;
  return readyToUse ? 'Ready' : isError ? 'Error' : 'Pending';
};

export const snapshotSize = (snapshot: VolumeSnapshotKind): number => {
  const size = snapshot?.status?.restoreSize;
  return size ? convertToBaseValue(size) : 0;
};

export const snapshotSource = (snapshot: VolumeSnapshotKind): string =>
  snapshot.spec?.source?.persistentVolumeClaimName ??
  snapshot.spec?.source?.volumeSnapshotContentName;

export const snapshotContentSize = (snapshot: VolumeSnapshotContentKind): number => {
  return snapshot?.status?.restoreSize ?? 0;
};
