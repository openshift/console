import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { DiskType } from '../../constants/vm/storage';

const typeReducer = (obj) => {
  const diskType = obj?.type || DiskType.DISK;
  return diskType.getValue();
};

export const diskSourceFilter: RowFilter = {
  filterGroupName: 'Disk Type',
  type: 'disk-types',
  reducer: typeReducer,
  items: DiskType.getAll().map((diskType) => ({
    id: diskType.getValue(),
    title: diskType.toString(),
  })),
  filter: (disks, obj) => {
    const diskType = typeReducer(obj);
    return (
      disks.selected.size === 0 || disks.selected.has(diskType) || !_.includes(disks.all, diskType)
    );
  },
};
