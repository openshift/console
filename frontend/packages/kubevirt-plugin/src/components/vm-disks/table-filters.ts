import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { DiskType } from '../../constants/vm/storage';

const sourceReducer = (obj) => {
  const source = obj?.source;
  const type = obj?.metadata?.type;

  if (type === DiskType.CDROM) {
    return 'cdrom';
  }

  if (['Config Map', 'Secret', 'Service Account'].includes(source)) {
    return 'env';
  }

  return 'disk';
};

export const diskSourceFilter: RowFilter = {
  filterGroupName: 'Category',
  type: 'disks',
  reducer: sourceReducer,
  items: [
    {
      id: 'disk',
      title: 'Disks',
    },
    {
      id: 'cdrom',
      title: 'CD ROMs',
    },
    {
      id: 'env',
      title: 'Envionment Volumes',
    },
  ],
  filter: (disks, obj) => {
    const source = sourceReducer(obj);
    return (
      disks.selected.size === 0 || disks.selected.has(source) || !_.includes(disks.all, source)
    );
  },
};
