import { K8sKind } from '@console/internal/module/k8s/types';

export const VirtualMachineModel: K8sKind = {
  label: 'Virtual Machine',
  labelPlural: 'Virtual Machines',
  apiVersion: 'v1',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachines',
  abbr: 'VM',
  namespaced: true,
  kind: 'VirtualMachine',
  id: 'virtualmachine',
  crd: true,
};

export const VirtualMachineInstanceModel: K8sKind = {
  label: 'Virtual Machine Instance',
  labelPlural: 'Virtual Machine Instances',
  apiVersion: 'v1',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstances',
  abbr: 'VMI',
  namespaced: true,
  kind: 'VirtualMachineInstance',
  id: 'virtualmachineinstance',
  color: '#002F5D',
  crd: true,
};

export const DataVolumeModel: K8sKind = {
  label: 'Data Volume',
  labelPlural: 'Data Volumes',
  apiVersion: 'v1beta1',
  apiGroup: 'cdi.kubevirt.io',
  plural: 'datavolumes',
  abbr: 'DV',
  namespaced: true,
  kind: 'DataVolume',
  id: 'datavolume',
  crd: true,
};

export const HyperConvergedModel = {
  kind: 'HyperConverged',
  label: 'HyperConverged',
  labelPlural: 'HyperConvergeds',
  apiGroup: 'hco.kubevirt.io',
  apiVersion: 'v1beta1',
  abbr: 'HC',
  namespaced: true,
  crd: true,
  plural: 'hyperconvergeds',
};

export const VirtualMachineImportModel: K8sKind = {
  label: 'Virtual Machine Import',
  labelPlural: 'Virtual Machine Imports',
  apiVersion: 'v1beta1',
  apiGroup: 'v2v.kubevirt.io',
  plural: 'virtualmachineimports',
  abbr: 'VIM',
  namespaced: true,
  kind: 'VirtualMachineImport',
  id: 'virtualmachineimport',
  crd: true,
};

export const VirtualMachineInstanceMigrationModel: K8sKind = {
  label: 'Virtual Machine Instance Migration',
  labelPlural: 'Virtual Machine Instance Migrations',
  apiVersion: 'v1',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancemigrations',
  abbr: 'VMIM',
  namespaced: true,
  kind: 'VirtualMachineInstanceMigration',
  id: 'virtualmachineinstancemigration',
  crd: true,
};

export const VirtualMachineSnapshotModel: K8sKind = {
  label: 'Virtual Machine Snapshot',
  labelPlural: 'Virtual Machine Snapshots',
  apiVersion: 'v1alpha1',
  apiGroup: 'snapshot.kubevirt.io',
  plural: 'virtualmachinesnapshots',
  abbr: 'VMS',
  namespaced: true,
  kind: 'VirtualMachineSnapshot',
  id: 'virtualmachinesnapshot',
  crd: true,
};
