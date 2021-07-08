import { NodeKind } from '@console/internal/module/k8s';
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { getName } from '@console/shared/src/selectors/common';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import { NODE_STATUS_TITLE_KEYS } from '../../../constants';
import { getNodeMaintenanceNodeName } from '../../../selectors';
import { getNodeServerCSR } from '../../../selectors/csr';
import { bareMetalNodeStatus, NODE_STATUS_SERVER_CSR } from '../../../status/baremetal-node-status';
import { CertificateSigningRequestKind } from '../../../types';

const BMN_STATUS_GROUP_MAPPER = {
  [InventoryStatusGroup.PROGRESS]: ['Not Ready', NODE_STATUS_SERVER_CSR],
  [InventoryStatusGroup.NOT_MAPPED]: ['Ready'],
  'node-maintenance': Object.keys(NODE_STATUS_TITLE_KEYS),
};

export const getBMNStatusGroups: StatusGroupMapper = (
  nodes: NodeKind[],
  { maintenances, csrs, oldMaintenances },
) => {
  const groups = {
    [InventoryStatusGroup.NOT_MAPPED]: {
      statusIDs: ['ready'],
      count: 0,
      filterType: 'bare-metal-node-status',
    },
    [InventoryStatusGroup.PROGRESS]: {
      statusIDs: ['notReady', 'approval'],
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
  const oldMaintenancesByNodeName = createBasicLookup(oldMaintenances, getNodeMaintenanceNodeName);
  nodes.forEach((node) => {
    const nodeName = getName(node);
    const nodeMaintenance = maintenancesByNodeName[nodeName] || oldMaintenancesByNodeName[nodeName];
    const csr = getNodeServerCSR(csrs as CertificateSigningRequestKind[], node);
    const { status } = bareMetalNodeStatus({ node, nodeMaintenance, csr });
    const group =
      Object.keys(BMN_STATUS_GROUP_MAPPER).find((key) =>
        BMN_STATUS_GROUP_MAPPER[key].includes(status),
      ) || InventoryStatusGroup.NOT_MAPPED;
    groups[group].count++;
  });
  return groups;
};
