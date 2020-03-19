import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import { getName } from '@console/shared/src/selectors/common';
import { NodeKind } from '@console/internal/module/k8s';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { getNodeMaintenanceNodeName } from '../../../selectors';
import { bareMetalNodeStatus } from '../../../status/baremetal-node-status';
import { NODE_STATUS_TITLES } from '../../../constants';

const BMN_STATUS_GROUP_MAPPER = {
  [InventoryStatusGroup.PROGRESS]: ['Not Ready'],
  [InventoryStatusGroup.NOT_MAPPED]: ['Ready'],
  'node-maintenance': Object.keys(NODE_STATUS_TITLES),
};

export const getBMNStatusGroups: StatusGroupMapper = (nodes: NodeKind[], { maintenances }) => {
  const groups = {
    [InventoryStatusGroup.NOT_MAPPED]: {
      statusIDs: ['ready'],
      count: 0,
      filterType: 'bare-metal-node-status',
    },
    [InventoryStatusGroup.PROGRESS]: {
      statusIDs: ['notReady'],
      count: 0,
      filterType: 'bare-metal-node-status',
    },
    'node-maintenance': {
      statusIDs: ['maintenance'],
      count: 0,
      filterType: 'bare-metal-node-status',
    },
  };
  const maintenancesByNodeName = createBasicLookup(maintenances, getNodeMaintenanceNodeName);
  nodes.forEach((node) => {
    const nodeName = getName(node);
    const nodeMaintenance = maintenancesByNodeName[nodeName];
    const { status } = bareMetalNodeStatus({ node, nodeMaintenance });
    const group =
      Object.keys(BMN_STATUS_GROUP_MAPPER).find((key) =>
        BMN_STATUS_GROUP_MAPPER[key].includes(status),
      ) || InventoryStatusGroup.NOT_MAPPED;
    groups[group].count++;
  });
  return groups;
};
