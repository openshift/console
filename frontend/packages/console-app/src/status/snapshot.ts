import { VolumeSnapshotStatus } from '@console/internal/module/k8s';

export const volumeSnapshotStatus = ({ status }: { status: VolumeSnapshotStatus }) => {
  const readyToUse = status?.readyToUse;
  const isError = !!status?.error?.message;
  return readyToUse ? 'Ready' : isError ? 'Error' : 'Pending';
};

export const snapshotStatusFilters = [
  {
    filterGroupName: 'Status',
    type: 'snapshot-status',
    reducer: volumeSnapshotStatus,
    items: [
      { id: 'Ready', title: 'Ready' },
      { id: 'Pending', title: 'Pending' },
      { id: 'Error', title: 'Error' },
    ],
  },
];
