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

export const VirtualMachineInstancePresetModel: K8sKind = {
  label: 'Virtual Machine Instance Preset',
  labelPlural: 'Virtual Machine Instance Presets',
  apiVersion: 'v1',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancepresets',
  abbr: 'VMIP',
  namespaced: true,
  kind: 'VirtualMachineInstancePreset',
  id: 'virtualmachineinstancepreset',
  crd: true,
};

export const VirtualMachineInstanceReplicaSetModel: K8sKind = {
  label: 'Virtual Machine Instance Replica Set',
  labelPlural: 'Virtual Machine Instance Replica Sets',
  apiVersion: 'v1',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancereplicasets',
  abbr: 'VMIR',
  namespaced: true,
  kind: 'VirtualMachineInstanceReplicaSet',
  id: 'virtualmachineinstancereplicaset',
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

export const V2VVMwareModel: K8sKind = {
  label: 'V2V VMWare Provider',
  labelPlural: 'V2V VMWare Providers',
  apiVersion: 'v1alpha1',
  apiGroup: 'v2v.kubevirt.io',
  plural: 'v2vvmwares',
  abbr: 'VVW',
  namespaced: true,
  kind: 'V2VVmware',
  id: 'v2vvmware',
  crd: true,
};

export const OVirtProviderModel: K8sKind = {
  label: 'Ovirt Provider',
  labelPlural: 'Ovirt Providers',
  apiVersion: 'v1alpha1',
  apiGroup: 'v2v.kubevirt.io',
  plural: 'ovirtproviders',
  abbr: 'OVP',
  namespaced: true,
  kind: 'OVirtProvider',
  id: 'ovirtprovider',
  crd: true,
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

export const UploadTokenRequestModel: K8sKind = {
  label: 'Upload Token Request',
  labelPlural: 'Upload Token Requests',
  apiVersion: 'v1beta1',
  apiGroup: 'upload.cdi.kubevirt.io',
  namespaced: true,
  plural: 'uploadtokenrequests',
  abbr: 'utr',
  kind: 'UploadTokenRequest',
  id: 'uploadtokenrequest',
  crd: true,
};

export const CDIConfigModel: K8sKind = {
  label: 'CDI Config',
  labelPlural: 'CDI Configs',
  apiVersion: 'v1beta1',
  apiGroup: 'cdi.kubevirt.io',
  namespaced: false,
  plural: 'cdiconfigs',
  abbr: 'cdic',
  kind: 'CDIConfig',
  id: 'cdiconfig',
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

export const VirtualMachineRestoreModel: K8sKind = {
  label: 'Virtual Machine Restore',
  labelPlural: 'Virtual Machine Restores',
  apiVersion: 'v1alpha1',
  apiGroup: 'snapshot.kubevirt.io',
  plural: 'virtualmachinerestores',
  abbr: 'VMR',
  namespaced: true,
  kind: 'VirtualMachineRestore',
  id: 'virtualmachinerestore',
  crd: true,
};
