import { TFunction } from 'i18next';
import { RowFilter } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { VolumeGroupSnapshotStatus, VolumeSnapshotStatus } from '@console/internal/module/k8s';

export const volumeSnapshotStatus = ({
  status,
}: {
  status?: VolumeSnapshotStatus | VolumeGroupSnapshotStatus;
}) => {
  const readyToUse = status?.readyToUse;
  const isError = !!status?.error?.message;
  return readyToUse ? 'Ready' : isError ? 'Error' : 'Pending';
};

export const snapshotStatusFilters = (t: TFunction): RowFilter[] => {
  return [
    {
      filterGroupName: t('console-app~Status'),
      type: 'snapshot-status',
      reducer: volumeSnapshotStatus,
      filter: () => null,
      items: [
        { id: 'Ready', title: 'Ready' },
        { id: 'Pending', title: 'Pending' },
        { id: 'Error', title: 'Error' },
      ],
    },
  ];
};
