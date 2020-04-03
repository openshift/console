import { podPhaseFilterReducer } from '@console/internal/module/k8s/pods';
import { nodeStatus } from '@console/app/src/status/node';
import { StatusGroupMapper } from './InventoryItem';
import { InventoryStatusGroup } from './status-group';

const POD_PHASE_GROUP_MAPPING = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Running', 'Succeeded'],
  [InventoryStatusGroup.ERROR]: ['CrashLoopBackOff', 'Failed'],
  [InventoryStatusGroup.PROGRESS]: ['Terminating', 'Pending'],
  [InventoryStatusGroup.WARN]: ['Unknown'],
};

const PVC_STATUS_GROUP_MAPPING = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Bound'],
  [InventoryStatusGroup.ERROR]: ['Lost'],
  [InventoryStatusGroup.PROGRESS]: ['Pending'],
};

const PV_STATUS_GROUP_MAPPING = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Available', 'Bound'],
  [InventoryStatusGroup.PROGRESS]: ['Released'],
  [InventoryStatusGroup.ERROR]: ['Failed'],
};

const NODE_STATUS_GROUP_MAPPING = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Ready'],
  [InventoryStatusGroup.PROGRESS]: ['Not Ready'],
};

const getStatusGroups = (resources, mapping, mapper, filterType) => {
  const groups = {
    [InventoryStatusGroup.UNKNOWN]: {
      statusIDs: [],
      count: 0,
    },
  };
  Object.keys(mapping).forEach((key) => {
    groups[key] = {
      statusIDs: [...mapping[key]],
      count: 0,
      filterType,
    };
  });

  resources.forEach((resource) => {
    const status = mapper(resource);
    const group =
      Object.keys(mapping).find((key) => mapping[key].includes(status)) ||
      InventoryStatusGroup.UNKNOWN;
    groups[group].count++;
  });

  return groups;
};

export const getPodStatusGroups: StatusGroupMapper = (resources) =>
  getStatusGroups(resources, POD_PHASE_GROUP_MAPPING, podPhaseFilterReducer, 'pod-status');
export const getNodeStatusGroups: StatusGroupMapper = (resources) =>
  getStatusGroups(resources, NODE_STATUS_GROUP_MAPPING, nodeStatus, 'node-status');
export const getPVCStatusGroups: StatusGroupMapper = (resources) =>
  getStatusGroups(resources, PVC_STATUS_GROUP_MAPPING, (pvc) => pvc.status.phase, 'pvc-status');
export const getPVStatusGroups: StatusGroupMapper = (resources) =>
  getStatusGroups(resources, PV_STATUS_GROUP_MAPPING, (pv) => pv.status.phase, 'pv-status');
