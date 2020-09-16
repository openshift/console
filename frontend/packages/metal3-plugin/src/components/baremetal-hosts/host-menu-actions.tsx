import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import {
  K8sKind,
  k8sPatch,
  K8sResourceKind,
  MachineKind,
  MachineSetKind,
  NodeKind,
  referenceForModel,
  Patch,
} from '@console/internal/module/k8s';
import {
  getMachineNode,
  getMachineNodeName,
  getName,
  getNamespace,
  getAnnotations,
} from '@console/shared';
import { confirmModal, deleteModal } from '@console/internal/components/modals';
import { MachineModel, MachineSetModel } from '@console/internal/models';
import { patchSafeValue } from '@console/shared/src/k8s';
import {
  findNodeMaintenance,
  getHostMachine,
  getHostPowerStatus,
  isHostScheduledForRestart,
  hasPowerManagement,
  getPoweroffAnnotation,
} from '../../selectors';
import { BareMetalHostModel, NodeMaintenanceModel } from '../../models';
import { getHostStatus } from '../../status/host-status';
import {
  HOST_POWER_STATUS_POWERED_OFF,
  HOST_POWER_STATUS_POWERED_ON,
  HOST_POWER_STATUS_POWERING_OFF,
  HOST_POWER_STATUS_POWERING_ON,
  HOST_STATUS_AVAILABLE,
  HOST_STATUS_UNMANAGED,
  HOST_STATUS_READY,
  HOST_ERROR_STATES,
  HOST_STATUS_UNKNOWN,
} from '../../constants';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import { powerOffHostModal } from '../modals/PowerOffHostModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';
import { BareMetalHostKind } from '../../types';
import { DELETE_MACHINE_ANNOTATION } from '../../constants/machine';
import { deprovision } from '../../k8s/requests/bare-metal-host';
import { getMachineMachineSetOwner } from '../../selectors/machine';
import { findMachineSet } from '../../selectors/machine-set';
import { restartHostModal } from '../modals/RestartHostModal';
import { StatusProps } from '../types';

type ActionArgs = {
  machine?: MachineKind;
  machineSet?: MachineSetKind;
  nodeName?: string;
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability?: boolean;
  status: StatusProps;
};

export const Edit = (kindObj: K8sKind, host: BareMetalHostKind): KebabOption => ({
  label: `Edit ${kindObj.label}`,
  href: `/k8s/ns/${getNamespace(host)}/${referenceForModel(kindObj)}/${getName(host)}/edit`,
});

export const SetNodeMaintenance = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
  label: 'Start Maintenance',
  callback: () => startNodeMaintenanceModal({ nodeName }),
});

export const RemoveNodeMaintenance = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance,
  label: 'Stop Maintenance',
  callback: () => stopNodeMaintenanceModal(nodeMaintenance),
  accessReview: nodeMaintenance && asAccessReview(NodeMaintenanceModel, nodeMaintenance, 'delete'),
});

export const PowerOn = (kindObj: K8sKind, host: BareMetalHostKind): KebabOption => {
  const title = 'Power On';
  return {
    hidden:
      [HOST_POWER_STATUS_POWERED_ON, HOST_POWER_STATUS_POWERING_ON].includes(
        getHostPowerStatus(host),
      ) || !hasPowerManagement(host),
    label: title,
    callback: () => {
      const patches: Patch[] = [{ op: 'replace', path: '/spec/online', value: true }];
      const poweroffAnnotation = getPoweroffAnnotation(host);
      if (poweroffAnnotation) {
        patches.push({
          op: 'remove',
          path: `/metadata/annotations/${patchSafeValue(poweroffAnnotation)}`,
        });
      }
      k8sPatch(BareMetalHostModel, host, patches);
    },
    accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
  };
};

export const Deprovision = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { machine, machineSet }: ActionArgs,
): KebabOption => {
  const title = 'Deprovision';
  return {
    hidden:
      [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
        getHostPowerStatus(host),
      ) ||
      isHostScheduledForRestart(host) ||
      !machine ||
      !!getAnnotations(machine, {})[DELETE_MACHINE_ANNOTATION] ||
      (getMachineMachineSetOwner(machine) && !machineSet),
    label: title,
    callback: () =>
      confirmModal({
        title: `${title} ${getName(host)}`,
        message: `Are you sure you want to delete ${getName(machine)} machine${
          machineSet ? ' and scale down its machine set?' : '?'
        }`,
        btnText: title,
        executeFn: () => deprovision(machine, machineSet),
      }),
    accessReview: machineSet
      ? asAccessReview(MachineSetModel, machineSet, 'update')
      : asAccessReview(MachineModel, machine, 'delete'),
  };
};

export const PowerOff = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { nodeName, status }: ActionArgs,
) => ({
  hidden:
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) || !hasPowerManagement(host),
  label: 'Power Off',
  callback: () => powerOffHostModal({ host, nodeName, status }),
  accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
});

export const Restart = (kindObj: K8sKind, host: BareMetalHostKind, { nodeName }: ActionArgs) => ({
  hidden:
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) ||
    isHostScheduledForRestart(host) ||
    !hasPowerManagement(host),
  label: 'Restart',
  callback: () => restartHostModal({ host, nodeName }),
  accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
});

export const Delete = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { status }: ActionArgs,
): KebabOption => {
  const title = 'Delete Bare Metal Host';
  return {
    hidden: ![
      HOST_STATUS_UNKNOWN,
      HOST_STATUS_READY,
      HOST_STATUS_AVAILABLE,
      HOST_STATUS_UNMANAGED,
      ...HOST_ERROR_STATES,
    ].includes(status.status),
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
  Deprovision,
  PowerOff,
  Restart,
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Edit,
  Delete,
];

type ExtraResources = {
  machines: MachineKind[];
  machineSets: MachineSetKind[];
  nodes: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

export const menuActionsCreator = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { machines, machineSets, nodes, nodeMaintenances }: ExtraResources,
  { hasNodeMaintenanceCapability },
) => {
  const machine = getHostMachine(host, machines);
  const node = getMachineNode(machine, nodes);
  const nodeName = getMachineNodeName(machine);
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);
  const status = getHostStatus({ host, machine, node, nodeMaintenance });

  const machineOwner = getMachineMachineSetOwner(machine);
  const machineSet = findMachineSet(machineSets, machineOwner && machineOwner.uid);

  return menuActions.map((action) => {
    return action(kindObj, host, {
      hasNodeMaintenanceCapability,
      nodeMaintenance,
      nodeName,
      machine,
      machineSet,
      status,
    });
  });
};
