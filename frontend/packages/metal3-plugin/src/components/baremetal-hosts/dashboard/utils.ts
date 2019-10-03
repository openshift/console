import { StatusGroupMapper } from '@console/internal/components/dashboard/generic/inventory-card/inventory-item';
import { InventoryStatusGroup } from '@console/internal/components/dashboard/generic/inventory-card/status-group';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getMachineNode, getName } from '@console/shared/src/selectors';
import { getHostStatus } from '../../../utils/host-status';
import { HOST_ERROR_STATES, HOST_PROGRESS_STATES, HOST_SUCCESS_STATES } from '../../../constants';
import { findNodeMaintenance, getHostMachine } from '../../../selectors';
import { getHostFilterStatus } from '../table-filters';
import { BareMetalHostKind } from '../../../types';

const BMH_STATUS_GROUP_MAPPER = {
  [InventoryStatusGroup.NOT_MAPPED]: HOST_SUCCESS_STATES,
  [InventoryStatusGroup.PROGRESS]: HOST_PROGRESS_STATES,
  [InventoryStatusGroup.ERROR]: HOST_ERROR_STATES,
};

export const getBMHStatusGroups: StatusGroupMapper = (
  hosts: BareMetalHostKind[],
  { machines, nodes, maintenances },
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
  };

  hosts.forEach((host) => {
    const machine = getHostMachine(host, machines as MachineKind[]);
    const node = getMachineNode(machine, nodes as NodeKind[]);
    const nodeMaintenance = findNodeMaintenance(maintenances, getName(node));
    const hostMultiStatus = getHostStatus({ host, nodeMaintenance });

    const status = getHostFilterStatus({
      machine,
      node,
      host,
      nodeMaintenance,
      status: hostMultiStatus,
    });
    const group =
      Object.keys(BMH_STATUS_GROUP_MAPPER).find((key) =>
        BMH_STATUS_GROUP_MAPPER[key].includes(status),
      ) || InventoryStatusGroup.NOT_MAPPED;
    groups[group].count++;
  });

  return groups;
};
