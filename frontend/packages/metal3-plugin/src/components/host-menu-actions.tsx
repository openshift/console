import { asAccessReview, KebabOption } from '@console/internal/components/utils';
import {
  K8sKind,
  K8sResourceKind,
  k8sPatch,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getMachineNode, getMachineNodeName, getName } from '@console/shared';
import { findNodeMaintenance, getHostMachine, getHostPowerStatus } from '../selectors';
import { BaremetalHostModel, NodeMaintenanceModel } from '../models';
import { getHostStatus } from '../utils/host-status';
import {
  HOST_POWER_STATUS_POWERING_OFF,
  HOST_POWER_STATUS_POWERED_ON,
  HOST_POWER_STATUS_POWERING_ON,
  HOST_POWER_STATUS_POWERED_OFF,
} from '../constants';
import { startNodeMaintenanceModal } from './modals/start-node-maintenance-modal';
import { powerOffHostModal } from './modals/power-off-host-modal';
import stopNodeMaintenanceModal from './modals/stop-node-maintenance-modal';

type ActionArgs = {
  nodeName?: string;
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability: boolean;
  status: string;
};

export const SetNodeMaintenance = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
  label: 'Start maintenance',
  callback: () => startNodeMaintenanceModal({ nodeName }),
});

export const RemoveNodeMaintenance = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: {},
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => {
  const hostName = getName(host);
  return {
    hidden: !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance,
    label: 'Stop maintenance',
    callback: () => stopNodeMaintenanceModal(nodeMaintenance, hostName),
    accessReview:
      nodeMaintenance && asAccessReview(NodeMaintenanceModel, nodeMaintenance, 'delete'),
  };
};

export const PowerOn = (kindObj: K8sKind, host: K8sResourceKind): KebabOption => {
  const title = 'Power on';
  return {
    hidden: [HOST_POWER_STATUS_POWERED_ON, HOST_POWER_STATUS_POWERING_ON].includes(
      getHostPowerStatus(host),
    ),
    label: title,
    callback: () => {
      k8sPatch(BaremetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);
    },
    accessReview: host && asAccessReview(BaremetalHostModel, host, 'update'),
  };
};

export const PowerOff = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: null,
  { hasNodeMaintenanceCapability, nodeName, status }: ActionArgs,
) => ({
  hidden: [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
    getHostPowerStatus(host),
  ),
  label: 'Shut down',
  callback: () => powerOffHostModal({ hasNodeMaintenanceCapability, host, nodeName, status }),
  accessReview: host && asAccessReview(BaremetalHostModel, host, 'update'),
});

export const menuActions = [SetNodeMaintenance, RemoveNodeMaintenance, PowerOn, PowerOff];

type ExtraResources = {
  machines: MachineKind[];
  nodes: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

export const menuActionsCreator = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  { machines, nodes, nodeMaintenances }: ExtraResources,
  { hasNodeMaintenanceCapability },
) => {
  const machine = getHostMachine(host, machines);
  const node = getMachineNode(machine, nodes);
  const nodeName = getMachineNodeName(machine);
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);
  const status = getHostStatus({ host, machine, node, nodeMaintenance });

  return menuActions.map((action) => {
    return action(kindObj, host, null, {
      hasNodeMaintenanceCapability,
      nodeMaintenance,
      nodeName,
      status: status.status,
    });
  });
};
