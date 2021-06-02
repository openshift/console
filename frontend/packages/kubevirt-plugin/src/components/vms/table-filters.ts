import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { VM_STATUS_SIMPLE_LABELS } from '../../constants/vm/vm-status';
import { VMStatusBundle } from '../../statuses/vm/types';

export const vmStatusFilter: RowFilter = {
  filterGroupName: 'Status',
  type: 'vm-status',
  reducer: (obj) => {
    return ((obj?.metadata as any)?.vmStatusBundle as VMStatusBundle)?.status?.getSimpleLabel();
  },
  items: VM_STATUS_SIMPLE_LABELS.map((status) => ({
    id: status,
    title: status,
  })),
  filter: (statuses, obj) => {
    const status = ((obj?.metadata as any)
      ?.vmStatusBundle as VMStatusBundle)?.status.getSimpleLabel();
    return (
      statuses.selected.size === 0 ||
      statuses.selected.has(status) ||
      !_.includes(statuses.all, status)
    );
  },
};
