import * as _ from 'lodash';
import { RowFilter } from '@console/dynamic-plugin-sdk';
import {
  getVmStatusLabelFromPrintable,
  getVmStatusLabelFromVMIPhase,
  VM_STATUS_SIMPLE_LABELS,
} from '../../constants/vm/vm-status';
import { getStatusPhase } from '../../selectors';
import { isVMI } from '../../selectors/check-type';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMILikeEntityKind } from '../../types/vmLike';

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
      statuses.selected?.length === 0 ||
      statuses.selected?.includes(status) ||
      !_.includes(statuses.all, status)
    );
  },
};

export const vmTableFilters: RowFilter<VMILikeEntityKind>[] = [
  {
    filterGroupName: 'Status',
    type: 'vm-status',
    reducer: (obj) =>
      isVMI(obj)
        ? getVmStatusLabelFromVMIPhase(getStatusPhase(obj))
        : getVmStatusLabelFromPrintable(obj?.status?.printableStatus),
    filter: (statuses, obj) => {
      const status = isVMI(obj)
        ? getVmStatusLabelFromVMIPhase(getStatusPhase(obj))
        : getVmStatusLabelFromPrintable(obj?.status?.printableStatus);
      return (
        statuses.selected?.length === 0 ||
        statuses.selected?.includes(status) ||
        !statuses?.all?.find((s) => s === status)
      );
    },
    items: VM_STATUS_SIMPLE_LABELS.map((status) => ({
      id: status,
      title: status,
    })),
  },
];
