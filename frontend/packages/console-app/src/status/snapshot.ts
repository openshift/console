import type { TFunction } from 'i18next';
import type { RowFilter } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { snapshotStatus } from '@console/shared/src/sorts/snapshot';

export const snapshotStatusFilters = (t: TFunction): RowFilter[] => {
  return [
    {
      filterGroupName: t('console-app~Status'),
      type: 'snapshot-status',
      reducer: snapshotStatus,
      filter: () => null,
      items: [
        { id: 'Ready', title: 'Ready' },
        { id: 'Pending', title: 'Pending' },
        { id: 'Error', title: 'Error' },
      ],
    },
  ];
};
