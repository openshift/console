import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CommonActionCreator } from '@console/app/src/actions/hooks/types';
import { useCommonActions } from '@console/app/src/actions/hooks/useCommonActions';
import {
  Action,
  K8sKind,
  Patch,
  useK8sModel,
  useOverlay,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { DeleteOverlay } from '@console/internal/components/modals/delete-modal';
import { asAccessReview } from '@console/internal/components/utils';
import { MachineModel, MachineSetModel } from '@console/internal/models';
import { k8sPatch, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { patchSafeValue } from '@console/shared/src/k8s/patch';
import { getAnnotations, getName, getNamespace } from '@console/shared/src/selectors/common';
import {
  HOST_ERROR_STATES,
  HOST_POWER_STATUS_POWERED_OFF,
  HOST_POWER_STATUS_POWERED_ON,
  HOST_POWER_STATUS_POWERING_OFF,
  HOST_POWER_STATUS_POWERING_ON,
  HOST_STATUS_AVAILABLE,
  HOST_STATUS_READY,
  HOST_STATUS_UNKNOWN,
  HOST_STATUS_UNMANAGED,
} from '../../constants/bare-metal-host';
import { DELETE_MACHINE_ANNOTATION } from '../../constants/machine';
import { deprovision } from '../../k8s/requests/bare-metal-host';
import { BareMetalHostModel, NodeMaintenanceModel } from '../../models';
import {
  getHostPowerStatus,
  getPoweroffAnnotation,
  hasPowerManagement,
  isDetached,
  isHostScheduledForRestart,
} from '../../selectors/baremetal-hosts';
import { getMachineMachineSetOwner } from '../../selectors/machine';
import { BareMetalHostKind } from '../../types/host';
import { usePowerOffHostModalLauncher } from '../modals/PowerOffHostModal';
import { useRestartHostModalLauncher } from '../modals/RestartHostModal';
import { useStartNodeMaintenanceModalLauncher } from '../modals/StartNodeMaintenanceModal';
import { useStopNodeMaintenanceModal } from '../modals/StopNodeMaintenanceModal';

const useDeleteAction = (kindObj: K8sKind, host, status) => {
  const { t } = useTranslation();
  const launcher = useOverlay();
  const hidden = ![
    HOST_STATUS_UNKNOWN,
    HOST_STATUS_READY,
    HOST_STATUS_AVAILABLE,
    HOST_STATUS_UNMANAGED,
    ...HOST_ERROR_STATES,
  ].includes(status.status);
  const factory = useMemo(
    () => ({
      delete: () => ({
        id: 'delete-host',
        label: t('metal3-plugin~Delete Bare Metal Host'),
        cta: () =>
          launcher(DeleteOverlay, {
            kind: kindObj,
            resource: host,
          }),
        accessReview: asAccessReview(BareMetalHostModel, host, 'delete'),
      }),
    }),
    [t, kindObj, host, launcher],
  );
  const action = useMemo<Action[]>(() => (!hidden ? [factory.delete()] : []), [factory, hidden]);
  return action;
};

const useEditAction = (kindObj: K8sKind, host: BareMetalHostKind) => {
  const { t } = useTranslation();
  const factory = useMemo(
    () => ({
      edit: () => ({
        id: 'edit-host',
        label: t('metal3-plugin~Edit Bare Metal Host'),
        cta: {
          href: `/k8s/ns/${getNamespace(host)}/${kindObj && referenceForModel(kindObj)}/${getName(
            host,
          )}/edit`,
        },
      }),
    }),
    [host, kindObj, t],
  );
  const action = useMemo<Action[]>(() => [factory.edit()], [factory]);
  return action;
};

export const useSetNodeMaintenanceAction = (
  host: BareMetalHostKind,
  hasNodeMaintenanceCapability,
  nodeMaintenance,
  nodeName,
) => {
  const { t } = useTranslation();
  const hidden = !nodeName || !hasNodeMaintenanceCapability || !!nodeMaintenance;
  const startNodeMaintenanceModalLauncher = useStartNodeMaintenanceModalLauncher({ nodeName });
  const factory = useMemo(
    () => ({
      setNodeMaintenance: () => ({
        id: 'set-node-maintenance',
        label: t('metal3-plugin~Start Maintenance'),
        cta: startNodeMaintenanceModalLauncher,
        accessReview: host && asAccessReview(NodeMaintenanceModel, host, 'update'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [host, t],
  );
  const action = useMemo<Action[]>(() => (!hidden ? [factory.setNodeMaintenance()] : []), [
    factory,
    hidden,
  ]);
  return action;
};

export const useRemoveNodeMaintenanceAction = (
  host,
  hasNodeMaintenanceCapability,
  nodeMaintenance,
  nodeName,
  maintenanceModel,
) => {
  const { t } = useTranslation();
  const hidden = !nodeName || !hasNodeMaintenanceCapability || !nodeMaintenance;
  const stopNodeMaintenanceModalLauncher = useStopNodeMaintenanceModal(nodeMaintenance);
  const factory = useMemo(
    () => ({
      removeNodeMaintenance: () => ({
        id: 'remove-node-maintenance',
        label: t('metal3-plugin~Stop Maintenance'),
        cta: stopNodeMaintenanceModalLauncher,
        accessReview: host && asAccessReview(maintenanceModel, host, 'delete'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [host, t],
  );
  const action = useMemo<Action[]>(() => (!hidden ? [factory.removeNodeMaintenance()] : []), [
    factory,
    hidden,
  ]);
  return action;
};

const usePowerOnAction = (host, bmoEnabled) => {
  const { t } = useTranslation();
  const hidden =
    [HOST_POWER_STATUS_POWERED_ON, HOST_POWER_STATUS_POWERING_ON].includes(
      getHostPowerStatus(host),
    ) ||
    !hasPowerManagement(host) ||
    !bmoEnabled ||
    isDetached(host);
  const factory = useMemo(
    () => ({
      powerOn: () => ({
        id: 'power-on-host',
        label: t('metal3-plugin~Power On'),
        cta: () => {
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
      }),
    }),
    [host, t],
  );
  const action = useMemo<Action[]>(() => (!hidden ? [factory.powerOn()] : []), [factory, hidden]);
  return action;
};

const useRestartAction = (host, bmoEnabled) => {
  const { t } = useTranslation();
  const hidden =
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) ||
    isHostScheduledForRestart(host) ||
    !hasPowerManagement(host) ||
    !bmoEnabled ||
    isDetached(host);
  const restartModalLauncher = useRestartHostModalLauncher({ host });
  const factory = useMemo(
    () => ({
      restart: () => ({
        id: 'restart-host',
        label: t('metal3-plugin~Restart'),
        cta: restartModalLauncher,
        accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );
  const action = useMemo<Action[]>(() => (!hidden ? [factory.restart()] : []), [factory, hidden]);
  return action;
};

const usePowerOffAction = (host, nodeName, status, bmoEnabled) => {
  const { t } = useTranslation();
  const hidden =
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) ||
    !hasPowerManagement(host) ||
    !bmoEnabled ||
    isDetached(host);
  const powerOffModalLauncher = usePowerOffHostModalLauncher({ host, nodeName, status });
  const factory = useMemo(
    () => ({
      powerOff: () => ({
        id: 'power-off-host',
        label: t('metal3-plugin~Power Off'),
        cta: powerOffModalLauncher,
        accessReview: host && asAccessReview(BareMetalHostModel, host, 'update'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [host, nodeName, status, t],
  );
  const action = useMemo<Action[]>(() => (!hidden ? [factory.powerOff()] : []), [factory, hidden]);
  return action;
};

const useDeprovisionAction = (host, machine, machineSet, bmoEnabled) => {
  const { t } = useTranslation();
  const hidden =
    [HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERING_OFF].includes(
      getHostPowerStatus(host),
    ) ||
    isHostScheduledForRestart(host) ||
    !machine ||
    !!getAnnotations(machine, {})[DELETE_MACHINE_ANNOTATION] ||
    (getMachineMachineSetOwner(machine) && !machineSet) ||
    !bmoEnabled ||
    isDetached(host);
  const deprovisionModalLauncher = useWarningModal({
    title: t('metal3-plugin~Deprovision {{name}}', { name: getName(host) }),
    children: machineSet
      ? t(
          'metal3-plugin~Are you sure you want to delete {{name}} machine and scale down its machine set?',
          {
            name: getName(machine),
          },
        )
      : t('metal3-plugin~Are you sure you want to delete {{name}} machine?', {
          name: getName(machine),
        }),
    confirmButtonLabel: t('metal3-plugin~Deprovision'),
    onConfirm: () => deprovision(machine, machineSet),
  });

  const factory = useMemo(
    () => ({
      deprovision: () => ({
        id: 'deprovision-host',
        label: t('metal3-plugin~Deprovision'),
        cta: deprovisionModalLauncher,
        accessReview: machineSet
          ? asAccessReview(MachineSetModel, machineSet, 'update')
          : asAccessReview(MachineModel, machine, 'delete'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [machine, machineSet, t],
  );

  const action = useMemo<Action[]>(() => (!hidden ? [factory.deprovision()] : []), [
    factory,
    hidden,
  ]);
  return action;
};

export const useHostActionsProvider = (actionArgs) => {
  const {
    host,
    machineSet,
    machine,
    bmoEnabled,
    nodeName,
    status,
    maintenanceModel,
    nodeMaintenance,
  } = actionArgs;
  const hasNodeMaintenanceCapability = !!maintenanceModel;
  const [kindObj, inFlight] = useK8sModel(referenceFor(host ?? {}));
  const deleteAction = useDeleteAction(kindObj, host, status);
  const editAction = useEditAction(kindObj, host);
  const setNodeMaintenanceAction = useSetNodeMaintenanceAction(
    host,
    hasNodeMaintenanceCapability,
    nodeMaintenance,
    nodeName,
  );
  const removeNodeMaintenanceAction = useRemoveNodeMaintenanceAction(
    host,
    hasNodeMaintenanceCapability,
    nodeMaintenance,
    nodeName,
    maintenanceModel,
  );
  const deprovisionAction = useDeprovisionAction(host, machine, machineSet, bmoEnabled);
  const powerOffAction = usePowerOffAction(host, nodeName, status, bmoEnabled);
  const restartAction = useRestartAction(host, bmoEnabled);
  const powerOnAction = usePowerOnAction(host, bmoEnabled);
  const [labelsAnnotationsActions, isReady] = useCommonActions(kindObj, host, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
  ] as const);
  const commonActions = useMemo(() => (isReady ? Object.values(labelsAnnotationsActions) : []), [
    labelsAnnotationsActions,
    isReady,
  ]);
  const actions = useMemo(
    () => [
      ...setNodeMaintenanceAction,
      ...removeNodeMaintenanceAction,
      ...powerOnAction,
      ...deprovisionAction,
      ...powerOffAction,
      ...restartAction,
      ...commonActions,
      ...editAction,
      ...deleteAction,
    ],
    [
      deleteAction,
      deprovisionAction,
      editAction,
      powerOffAction,
      powerOnAction,
      removeNodeMaintenanceAction,
      restartAction,
      setNodeMaintenanceAction,
      commonActions,
    ],
  );

  return [actions, !inFlight, undefined];
};
