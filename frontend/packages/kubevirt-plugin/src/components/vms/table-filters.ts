import * as _ from 'lodash';
import { Filter } from '@console/shared';
import { VM_SIMPLE_STATUS_ALL, VM_SIMPLE_STATUS_TO_TEXT } from '../../statuses/vm/constants';
import { getSimpleVMStatus } from '../../statuses/vm/vm';

export const vmStatusFilter: Filter = {
  type: 'vm-status',
  selected: VM_SIMPLE_STATUS_ALL,
  reducer: getSimpleVMStatus,
  items: VM_SIMPLE_STATUS_ALL.map((status) => ({
    id: status,
    title: VM_SIMPLE_STATUS_TO_TEXT[status],
  })),
  filter: (statuses, vm) => {
    const status = getSimpleVMStatus(vm);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },
};
