import * as _ from 'lodash';

import {
  getSimpleVmStatus,
  VM_SIMPLE_STATUS_ALL,
  VM_SIMPLE_STATUS_TO_TEXT,
} from 'kubevirt-web-ui-components';
import { Filter } from '@console/shared';

export const vmStatusFilter: Filter = {
  type: 'vm-status',
  selected: VM_SIMPLE_STATUS_ALL,
  reducer: getSimpleVmStatus,
  items: VM_SIMPLE_STATUS_ALL.map((status) => ({
    id: status,
    title: VM_SIMPLE_STATUS_TO_TEXT[status],
  })),
  filter: (statuses, vm) => {
    const status = getSimpleVmStatus(vm);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },
};
