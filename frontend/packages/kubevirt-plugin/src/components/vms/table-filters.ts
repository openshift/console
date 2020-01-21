import * as _ from 'lodash';
import { Filter } from '@console/shared';
import { VM_STATUS_FILTER_STRINGS } from '../../statuses/vm/constants';

export const vmStatusFilter: Filter = {
  type: 'vm-status',
  selected: VM_STATUS_FILTER_STRINGS,
  reducer: (obj) => _.get(obj, 'metadata.status').split(' ')[0],
  items: VM_STATUS_FILTER_STRINGS.map((status) => ({
    id: status,
    title: status,
  })),
  filter: (statuses, obj) => {
    const status = _.get(obj, 'metadata.status').split(' ')[0];
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },
};
