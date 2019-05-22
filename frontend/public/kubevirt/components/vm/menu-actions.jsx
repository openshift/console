import React from 'react';
import {
  BasicMigrationDialog,
  isMigrating,
  isVmRunning,
  CloneDialog,
  getResource,
  findVMIMigration,
  getVmStatus,
  VM_STATUS_IMPORTING,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
} from 'kubevirt-web-ui-components';
import { isEmpty } from 'lodash-es';

import { Kebab, LoadingInline } from '../utils/okdutils';
import { k8sCreate, k8sPatch } from '../../module/okdk8s';
import {
  VirtualMachineInstanceModel,
  VirtualMachineInstanceMigrationModel,
  NamespaceModel,
  PersistentVolumeClaimModel,
  VirtualMachineModel,
  DataVolumeModel,
  PodModel,
} from '../../models/index';
import { startStopVmModal } from '../modals/start-stop-vm-modal';
import { restartVmModal } from '../modals/restart-vm-modal';
import { cancelVmiMigrationModal } from '../modals/cancel-vmi-migration-modal';
import {
  getLabelMatcher,
} from '../utils/resources';
import { modalResourceLauncher } from '../utils/modalResourceLauncher';
import { showError } from '../utils/showErrors';

const getStatusForVm = (vm, actionArgs) => {
  if (!actionArgs) {
    return null;
  }

  const pods = actionArgs[PodModel.kind];
  const migrations = actionArgs[VirtualMachineInstanceMigrationModel.kind];
  return getVmStatus(vm, pods, migrations);
};

const isImporting = (vm, actionArgs) => {
  const status = getStatusForVm(vm, actionArgs);
  return status && [VM_STATUS_IMPORTING, VM_STATUS_V2V_CONVERSION_IN_PROGRESS].includes(status.status);
};


const menuActionStart = (kind, vm, actionArgs) => {
  return {
    hidden: isImporting(vm, actionArgs) || isVmRunning(vm),
    label: 'Start Virtual Machine',
    callback: () => startStopVmModal({
      kind,
      resource: vm,
      start: true,
    }),
  };
};

const menuActionStop = (kind, vm) => {
  return {
    hidden: !isVmRunning(vm),
    label: 'Stop Virtual Machine',
    callback: () => startStopVmModal({
      kind,
      resource: vm,
      start: false,
    }),
  };
};

const menuActionRestart = (kind, vm, actionArgs) => {
  return {
    hidden: isImporting(vm, actionArgs) || !(actionArgs && !isEmpty(actionArgs[VirtualMachineInstanceModel.kind]) && isVmRunning(vm)),
    label: 'Restart Virtual Machine',
    callback: () => restartVmModal({
      kind,
      resource: vm,
    }),
  };
};

const menuActionClone = (kind, vm, actionArgs) => {
  return {
    hidden: isImporting(vm, actionArgs),
    label: 'Clone Virtual Machine',
    callback: () => {
      return modalResourceLauncher(CloneDialog, {
        namespaces: {
          resource: getResource(NamespaceModel),
          required: true,
        },
        persistentVolumeClaims: {
          resource: getResource(PersistentVolumeClaimModel),
          required: true,
        },
        virtualMachines: {
          resource: getResource(VirtualMachineModel),
          required: true,
        },
        dataVolumes: {
          resource: getResource(DataVolumeModel),
          required: true,
        },
      })({vm, k8sCreate, k8sPatch, LoadingComponent: LoadingInline});
    },
  };
};

const menuActionCancelMigration = (kind, vm, actionArgs) => {
  const migration = actionArgs && findVMIMigration(actionArgs[VirtualMachineInstanceMigrationModel.kind], actionArgs[VirtualMachineInstanceModel.kind]);
  return {
    hidden: !actionArgs || !isMigrating(migration),
    label: 'Cancel Virtual Machine Migration',
    callback: () => cancelVmiMigrationModal({
      migration,
    }),
  };
};

const menuActionMigrate = (kind, vm, actionArgs) => {
  const migration = actionArgs && findVMIMigration(actionArgs[VirtualMachineInstanceMigrationModel.kind], actionArgs[VirtualMachineInstanceModel.kind]);
  const { name, namespace } = vm.metadata;
  return {
    hidden: !actionArgs || isImporting(vm, actionArgs) || isMigrating(migration) || !(isEmpty(actionArgs[VirtualMachineInstanceModel.kind]) && isVmRunning(vm)),
    label: 'Migrate Virtual Machine',
    callback: () => {
      return modalResourceLauncher(BasicMigrationDialog, {
        virtualMachineInstance: {
          resource: getResource(VirtualMachineInstanceModel, {name, namespace, isList: false, matchLabels: getLabelMatcher(vm)}),
          required: true,
        },
      })({
        k8sCreate,
        onMigrationError: showError,
        virtualMachineInstance: {}, // initial - is required
      });
    },
  };
};

export const menuActions = [menuActionStart, menuActionStop, menuActionRestart, menuActionMigrate, menuActionCancelMigration, menuActionClone, Kebab.factory.Delete];
