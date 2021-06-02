import { TFunction } from 'i18next';
import { confirmModal, deleteModal } from '@console/internal/components/modals';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { MachineModel, MachineSetModel } from '@console/internal/models';
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
import { patchSafeValue } from '@console/shared/src/k8s';
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
import { DELETE_MACHINE_ANNOTATION } from '../../constants/machine';
import { deprovision } from '../../k8s/requests/bare-metal-host';
import { BareMetalHostModel } from '../../models';
import {
  findNodeMaintenance,
  getHostMachine,
  getHostPowerStatus,
  isHostScheduledForRestart,
  hasPowerManagement,
  getPoweroffAnnotation,
} from '../../selectors';
import { getMachineMachineSetOwner } from '../../selectors/machine';
import { findMachineSet } from '../../selectors/machine-set';
import { getHostStatus } from '../../status/host-status';
import { BareMetalHostKind } from '../../types';
import { powerOffHostModal } from '../modals/PowerOffHostModal';
import { restartHostModal } from '../modals/RestartHostModal';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';
import { StatusProps } from '../types';

type ActionArgs = {
  machine?: MachineKind;
  machineSet?: MachineSetKind;
  nodeName?: string;
  nodeMaintenance?: K8sResourceKind;
  hasNodeMaintenanceCapability?: boolean;
  maintenanceModel: K8sKind;
  status: StatusProps;
  bmoEnabled: string;
  t: TFunction;
};

export const Edit = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { t }: ActionArgs,
): KebabOption => ({
  label: t('metal3-plugin~Edit Bare Metal Host'),
  href: `/k8s/ns/${getNamespace(host)}/${referenceForModel(kindObj)}/${getName(host)}/edit`,
});

export const SetNodeMaintenance = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName, t }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance,
  label: t('metal3-plugin~Start Maintenance'),
  callback: () => startNodeMaintenanceModal({ nodeName }),
});

export const RemoveNodeMaintenance = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { hasNodeMaintenanceCapability, nodeMaintenance, nodeName, maintenanceModel, t }: ActionArgs,
): KebabOption => ({
  hidden: !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance,
  label: t('metal3-plugin~Stop Maintenance'),
  callback: () => stopNodeMaintenanceModal(nodeMaintenance, t),
  accessReview: nodeMaintenance && asAccessReview(maintenanceModel, nodeMaintenance, 'delete'),
});

export const PowerOn = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { bmoEnabled, t },
): KebabOption => {
  const title = t('metal3-plugin~Power On');
  return {
    hidden:
      [HOST_POWER_STATUS_POWERED_ON, HOST_POWER_STATUS_POWERING_ON].includes(
        getHostPowerStatus(host),
      ) ||
      !hasPowerManagement(host) ||
      !bmoEnabled,
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
  { machine, machineSet, bmoEnabled, t }: ActionArgs,
): KebabOption => {
  return {
    hidden:
      [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
        getHostPowerStatus(host),
      ) ||
      isHostScheduledForRestart(host) ||
      !machine ||
      !!getAnnotations(machine, {})[DELETE_MACHINE_ANNOTATION] ||
      (getMachineMachineSetOwner(machine) && !machineSet) ||
      !bmoEnabled,
    label: t('metal3-plugin~Deprovision'),
    callback: () =>
      confirmModal({
        title: t('metal3-plugin~Deprovision {{name}}', { name: getName(host) }),
        message: machineSet
          ? t(
              'metal3-plugin~Are you sure you want to delete {{name}} machine and scale down its machine set?',
              {
                name: getName(machine),
              },
            )
          : t('metal3-plugin~Are you sure you want to delete {{name}} machine?', {
              name: getName(machine),
            }),
        btnText: t('metal3-plugin~Deprovision'),
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
  { nodeName, status, bmoEnabled, t }: ActionArgs,
) => ({
  hidden:
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) ||
    !hasPowerManagement(host) ||
    !bmoEnabled,
  label: t('metal3-plugin~Power Off'),
  callback: () => powerOffHostModal({ host, nodeName, status }),
  accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
});

export const Restart = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { bmoEnabled, t }: ActionArgs,
) => ({
  hidden:
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) ||
    isHostScheduledForRestart(host) ||
    !hasPowerManagement(host) ||
    !bmoEnabled,
  label: t('metal3-plugin~Restart'),
  callback: () => restartHostModal({ host }),
  accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
});

export const Delete = (
  kindObj: K8sKind,
  host: BareMetalHostKind,
  { status, t }: ActionArgs,
): KebabOption => {
  const title = t('metal3-plugin~Delete Bare Metal Host');
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
  { hasNodeMaintenanceCapability, maintenanceModel, bmoEnabled, t },
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
      bmoEnabled,
      maintenanceModel,
      t,
    });
  });
};
