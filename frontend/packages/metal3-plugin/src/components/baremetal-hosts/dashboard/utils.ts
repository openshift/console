import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src/selectors/common';
import { getNodeMachineName } from '@console/shared/src/selectors/node';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import { getHostStatus } from '../../../status/host-status';
import { HOST_ERROR_STATES, HOST_PROGRESS_STATES, HOST_SUCCESS_STATES } from '../../../constants';
import { getHostMachine, getNodeMaintenanceNodeName } from '../../../selectors';
import { getHostFilterStatus } from '../table-filters';
import { BareMetalHostKind } from '../../../types';

const BMH_STATUS_GROUP_MAPPER = {
  [InventoryStatusGroup.NOT_MAPPED]: HOST_SUCCESS_STATES,
  [InventoryStatusGroup.PROGRESS]: HOST_PROGRESS_STATES,
  [InventoryStatusGroup.ERROR]: HOST_ERROR_STATES,
  'node-maintenance': ['maintenance'],
};

export const getBMHStatusGroups: StatusGroupMapper = (
  hosts: BareMetalHostKind[],
  { machines, nodes, maintenances, oldMaintenances },
) => {
  const groups = {
    [InventoryStatusGroup.NOT_MAPPED]: {
      statusIDs: ['ready', 'provisioned'],
      count: 0,
      filterType: 'host-status',
    },
    [InventoryStatusGroup.ERROR]: {
      statusIDs: ['error'],
      count: 0,
      filterType: 'host-status',
    },
    [InventoryStatusGroup.PROGRESS]: {
      statusIDs: ['registering', 'provisioning'],
      count: 0,
      filterType: 'host-status',
    },
    [InventoryStatusGroup.UNKNOWN]: {
      statusIDs: ['other'],
      count: 0,
      filterType: 'host-status',
    },
    'node-maintenance': {
      statusIDs: ['maintenance'],
      count: 0,
      filterType: 'host-status',
    },
  };

  const maintenancesByNodeName = createBasicLookup(maintenances, getNodeMaintenanceNodeName);
  const oldMaintenancesByNodeName = createBasicLookup(oldMaintenances, getNodeMaintenanceNodeName);
  const nodesByMachineName = createBasicLookup(nodes, getNodeMachineName);

  hosts.forEach((host) => {
    // TODO(jtomasek): replace this with createLookup once there is metal3.io/BareMetalHost annotation
    // on machines
    const machine = getHostMachine(host, machines as MachineKind[]);
    const node = nodesByMachineName[getName(machine)] as NodeKind;
    const nodeMaintenance =
      maintenancesByNodeName[getName(node)] || oldMaintenancesByNodeName[getName(node)];
    const bareMetalHostStatus = getHostStatus({ host, nodeMaintenance });

    const status = getHostFilterStatus({
      machine,
      node,
      host,
      nodeMaintenance,
      status: bareMetalHostStatus,
    });
    const group =
      Object.keys(BMH_STATUS_GROUP_MAPPER).find((key) =>
        BMH_STATUS_GROUP_MAPPER[key].includes(status),
      ) || InventoryStatusGroup.NOT_MAPPED;
    groups[group].count++;
  });

  return groups;
};
