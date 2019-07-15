import * as _ from 'lodash';
import * as React from 'react';
import { getResource, CloneDialog } from 'kubevirt-web-ui-components';
import {
  asAccessReview,
  Kebab,
  KebabOption,
  LoadingInline,
  FirehoseResult,
} from '@console/internal/components/utils';
import { k8sCreate, k8sPatch, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals';
import { NamespaceModel, PersistentVolumeClaimModel } from '@console/internal/models';
import { VMIKind, VMKind } from '../../types/vm';
import { isVMImporting, isVMRunning, isVMRunningWithVMI } from '../../selectors/vm';
import { getMigrationVMIName, isMigrating } from '../../selectors/vmim';
import {
  DataVolumeModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineModel,
} from '../../models';
import { K8sEntityMap, VMMultiStatus } from '../../types';
import { getLoadedData, getLookupId } from '../../utils';
import { restartVM, startVM, stopVM, VMActionType } from '../../k8s/requests/vm';
import { startVMIMigration } from '../../k8s/requests/vmi';
import { cancelMigration } from '../../k8s/requests/vmim';
import { createModalResourceLauncher } from '../modals/modal-resource-launcher';

type ActionArgs = {
  migrationLookup?: K8sEntityMap<K8sResourceKind>;
  vmiLookup?: K8sEntityMap<VMIKind>;
  vmStatus?: VMMultiStatus;
};

const getVMActionMessage = (vm, action: VMActionType) => (
  <React.Fragment>
    Are you sure you want to {action} <strong>{getName(vm)}</strong> in namespace{' '}
    <strong>{getNamespace(vm)}</strong>?
  </React.Fragment>
);

export const menuActionStart = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatus }: ActionArgs,
): KebabOption => {
  const title = 'Start Virtual Machine';
  return {
    hidden: isVMImporting(vmStatus) || isVMRunning(vm),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: getVMActionMessage(vm, VMActionType.Start),
        btnText: _.capitalize(VMActionType.Start),
        executeFn: () => startVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionStop = (kindObj: K8sKind, vm: VMKind): KebabOption => {
  const title = 'Stop Virtual Machine';
  return {
    hidden: !isVMRunning(vm),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: getVMActionMessage(vm, VMActionType.Stop),
        btnText: _.capitalize(VMActionType.Stop),
        executeFn: () => stopVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionRestart = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatus, vmiLookup }: ActionArgs,
): KebabOption => {
  const title = 'Restart Virtual Machine';
  return {
    hidden: isVMImporting(vmStatus) || !isVMRunningWithVMI({ vm, vmi: vmiLookup[getLookupId(vm)] }),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: getVMActionMessage(vm, VMActionType.Restart),
        btnText: _.capitalize(VMActionType.Restart),
        executeFn: () => restartVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionMigrate = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatus, migrationLookup, vmiLookup }: ActionArgs,
): KebabOption => {
  const title = 'Migrate Virtual Machine';
  const vmi = vmiLookup[getLookupId(vm)];
  const migration = migrationLookup[getLookupId(vm)];
  return {
    hidden: isVMImporting(vmStatus) || isMigrating(migration) || !isVMRunningWithVMI({ vm, vmi }),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: (
          <React.Fragment>
            Do you wish to migrate <strong>{getName(vmi)}</strong> vmi to another node?
          </React.Fragment>
        ),
        btnText: 'Migrate',
        executeFn: () => startVMIMigration(vmi),
      }),
    accessReview: asAccessReview(
      VirtualMachineInstanceMigrationModel,
      { metadata: { namespace: getNamespace(vm) } },
      'create',
    ),
  };
};

const menuActionCancelMigration = (
  kindObj: K8sKind,
  vm: VMKind,
  { migrationLookup }: ActionArgs,
): KebabOption => {
  const title = 'Cancel Virtual Machine Migration';
  const migration = migrationLookup[getLookupId(vm)];
  return {
    hidden: !isMigrating(migration),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: (
          <React.Fragment>
            Are you sure you want to cancel <strong>{getMigrationVMIName(migration)}</strong>{' '}
            migration in <strong>{getNamespace(migration)}</strong> namespace?
          </React.Fragment>
        ),
        btnText: 'Cancel Migration',
        executeFn: () => cancelMigration(migration),
      }),
    accessReview:
      migration && asAccessReview(VirtualMachineInstanceMigrationModel, migration, 'delete'),
  };
};

const menuActionClone = (kindObj: K8sKind, vm: VMKind, { vmStatus }: ActionArgs): KebabOption => {
  return {
    hidden: isVMImporting(vmStatus),
    label: 'Clone Virtual Machine',
    callback: () => {
      const namespace = getNamespace(vm);
      const resources = [
        getResource(NamespaceModel, { prop: 'namespaces' }),
        getResource(VirtualMachineModel, { prop: 'virtualMachines' }),
        getResource(PersistentVolumeClaimModel, { namespace, prop: 'persistentVolumeClaims' }),
        getResource(DataVolumeModel, { namespace, prop: 'dataVolumes' }),
      ];

      const resourcesToProps = (firehoseResults: { [key: string]: FirehoseResult }) => ({
        ...resources
          .map((r) => r.prop)
          .reduce((mappedResources, propName) => {
            mappedResources[propName] = getLoadedData(firehoseResults[propName], []);
            return mappedResources;
          }, {}),
      });
      const launcher = createModalResourceLauncher(CloneDialog, resources, resourcesToProps);
      launcher({
        vm,
        k8sCreate,
        k8sPatch,
        LoadingComponent: LoadingInline,
      });
    },
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

export const menuActions = [
  menuActionStart,
  menuActionStop,
  menuActionRestart,
  menuActionMigrate,
  menuActionCancelMigration,
  menuActionClone,
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Delete,
];
