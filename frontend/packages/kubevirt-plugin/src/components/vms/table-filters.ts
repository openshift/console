import * as _ from 'lodash';
import { Filter } from '@console/shared';
import { VMStatusSimpleLabel } from '../../constants/vm/vm-status';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getStringEnumValues } from '../../utils/types';

export const vmStatusFilter: Filter = {
  type: 'vm-status',
  selected: getStringEnumValues<VMStatusSimpleLabel>(VMStatusSimpleLabel),
  reducer: (obj) => {
    return ((obj?.metadata as any)?.vmStatus as VMStatusBundle)?.status?.getSimpleLabel();
  },
  items: getStringEnumValues<VMStatusSimpleLabel>(VMStatusSimpleLabel).map((status) => ({
    id: status,
    title: status,
  })),
  filter: (statuses, obj) => {
    const status = ((obj?.metadata as any)?.vmStatus as VMStatusBundle)?.status.getSimpleLabel();
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },
};
