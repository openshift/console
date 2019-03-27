import * as _ from 'lodash-es';
import React from 'react';
import {
  BasicMigrationDialog,
  isMigrating,
  isVmRunning,
  CloneDialog,
  getResource,
} from 'kubevirt-web-ui-components';

import { Kebab, LoadingInline } from '../utils/okdutils';
import { k8sCreate, k8sPatch } from '../../module/okdk8s';
import {
  VirtualMachineInstanceModel,
  VirtualMachineInstanceMigrationModel,
  NamespaceModel,
  PersistentVolumeClaimModel,
  VirtualMachineModel,
  DataVolumeModel,
} from '../../models/index';
import { startStopVmModal } from '../modals/start-stop-vm-modal';
import { restartVmModal } from '../modals/restart-vm-modal';
import { cancelVmiMigrationModal } from '../modals/cancel-vmi-migration-modal';
import {
  getLabelMatcher,
  findVMIMigration,
} from '../utils/resources';
import { modalResourceLauncher } from '../utils/modalResourceLauncher';
import { showError } from '../utils/showErrors';

const getStartStopActionLabel = (vm) => {
  return _.get(vm, 'spec.running', false) ? 'Stop Virtual Machine' : 'Start Virtual Machine';
};

const menuActionStart = (kind, vm) => ({
  label: getStartStopActionLabel(vm),
  callback: () => startStopVmModal({
    kind,
    resource: vm,
    start: !_.get(vm, 'spec.running', false),
  }),
});

const menuActionRestart = (kind, vm) => ({
  hidden: !_.get(vm, 'spec.running', false),
  label: 'Restart Virtual Machine',
  callback: () => restartVmModal({
    kind,
    resource: vm,
  }),
});

const menuActionClone = (kind, vm) => ({
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
    })({ vm, k8sCreate, k8sPatch, LoadingComponent: LoadingInline });
  },
});

const menuActionCancelMigration = (kind, vm, actionArgs) => {
  const migration = actionArgs && findVMIMigration(actionArgs[VirtualMachineInstanceMigrationModel.kind], _.get(actionArgs[VirtualMachineInstanceModel.kind], 'metadata.name'));
  return {
    hidden: !actionArgs || !isMigrating(migration),
    label: 'Cancel Virtual Machine Migration',
    callback: () => cancelVmiMigrationModal({
      migration,
    }),
  };
};

const menuActionMigrate = (kind, vm, actionArgs) => {
  const migration = actionArgs && findVMIMigration(actionArgs[VirtualMachineInstanceMigrationModel.kind], _.get(actionArgs[VirtualMachineInstanceModel.kind], 'metadata.name'));
  const { name, namespace } = vm.metadata;
  return {
    hidden: !actionArgs || !isVmRunning(vm) || isMigrating(vm, migration),
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

export const menuActions = [menuActionStart, menuActionRestart, menuActionMigrate, menuActionCancelMigration, menuActionClone, Kebab.factory.Delete];
