import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { getStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';

const OB_STATUS_GROUP_MAPPING = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Bound'],
  [InventoryStatusGroup.PROGRESS]: ['Released'],
  [InventoryStatusGroup.ERROR]: ['Failed'],
};

const OBC_STATUS_GROUP_MAPPING = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Bound'],
  [InventoryStatusGroup.PROGRESS]: ['Pending', 'Released'],
  [InventoryStatusGroup.ERROR]: ['Failed'],
};

export const getObStatusGroups: StatusGroupMapper = (resources) =>
  getStatusGroups(resources, OB_STATUS_GROUP_MAPPING, (ob) => ob.status.phase, 'ob-status');
export const getObcStatusGroups: StatusGroupMapper = (resources) =>
  getStatusGroups(resources, OBC_STATUS_GROUP_MAPPING, (obc) => obc.status.phase, 'obc-status');
