import { asAccessReview, KebabOption, Kebab } from '@console/internal/components/utils';
import {
  K8sKind,
  K8sResourceKind,
  k8sPatch,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { getMachineNode, getMachineNodeName, getName } from '@console/shared';
import { deleteModal } from '@console/internal/components/modals';
import { findNodeMaintenance, getHostMachine, getHostPowerStatus } from '../../selectors';
import { BareMetalHostModel, NodeMaintenanceModel } from '../../models';
import { getHostStatus } from '../../utils/host-status';
import {
  HOST_POWER_STATUS_POWERING_OFF,
  HOST_POWER_STATUS_POWERED_ON,
  HOST_POWER_STATUS_POWERING_ON,
  HOST_POWER_STATUS_POWERED_OFF,
  HOST_STATUS_READY,
  HOST_STATUS_REGISTRATION_ERROR,
} from '../../constants';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import { powerOffHostModal } from '../modals/PowerOffHostModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

type ActionArgs = {
  nodeName?: string;
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability?: boolean;
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
      k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);
    },
    accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
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
  accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
});

export const Delete = (
  kindObj: K8sKind,
  host: K8sResourceKind,
  resources: null,
  { status }: ActionArgs,
): KebabOption => {
  const title = 'Delete Bare Metal Host';
  return {
    hidden: ![HOST_STATUS_READY, HOST_STATUS_REGISTRATION_ERROR].includes(status),
    label: title,
    callback: () =>
      deleteModal({
        kind: kindObj,
        resource: host,
      }),
    accessReview: asAccessReview(BareMetalHostModel, host, 'delete'),
  };
};

export const menuActions = [
  SetNodeMaintenance,
  RemoveNodeMaintenance,
  PowerOn,
  PowerOff,
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Edit,
  Delete,
];

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
