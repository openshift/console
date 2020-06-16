import { K8sKind } from '@console/internal/module/k8s/types';

export const VirtualMachineModel: K8sKind = {
  label: 'Virtual Machine',
  labelPlural: 'Virtual Machines',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachines',
  abbr: 'VM',
  namespaced: true,
  kind: 'VirtualMachine',
  id: 'virtualmachine',
};

export const VirtualMachineInstanceModel: K8sKind = {
  label: 'Virtual Machine Instance',
  labelPlural: 'Virtual Machine Instances',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstances',
  abbr: 'VMI',
  namespaced: true,
  kind: 'VirtualMachineInstance',
  id: 'virtualmachineinstance',
  color: '#002F5D',
};

export const VirtualMachineInstancePresetModel: K8sKind = {
  label: 'Virtual Machine Instance Preset',
  labelPlural: 'Virtual Machine Instance Presets',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancepresets',
  abbr: 'VMIP',
  namespaced: true,
  kind: 'VirtualMachineInstancePreset',
  id: 'virtualmachineinstancepreset',
};

export const VirtualMachineInstanceReplicaSetModel: K8sKind = {
  label: 'Virtual Machine Instance Replica Set',
  labelPlural: 'Virtual Machine Instance Replica Sets',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancereplicasets',
  abbr: 'VMIR',
  namespaced: true,
  kind: 'VirtualMachineInstanceReplicaSet',
  id: 'virtualmachineinstancereplicaset',
};

export const VirtualMachineInstanceMigrationModel: K8sKind = {
  label: 'Virtual Machine Instance Migration',
  labelPlural: 'Virtual Machine Instance Migrations',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancemigrations',
  abbr: 'VMIM',
  namespaced: true,
  kind: 'VirtualMachineInstanceMigration',
  id: 'virtualmachineinstancemigration',
};

export const DataVolumeModel: K8sKind = {
  label: 'Data Volume',
  labelPlural: 'Data Volumes',
  apiVersion: 'v1alpha1',
  apiGroup: 'cdi.kubevirt.io',
  plural: 'datavolumes',
  abbr: 'DV',
  namespaced: true,
  kind: 'DataVolume',
  id: 'datavolume',
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
};

export const VirtualMachineImportModel: K8sKind = {
  label: 'Virtual Machine Import',
  labelPlural: 'Virtual Machine Imports',
  apiVersion: 'v1alpha1',
  apiGroup: 'v2v.kubevirt.io',
  plural: 'virtualmachineimports',
  abbr: 'VIM',
  namespaced: true,
  kind: 'VirtualMachineImport',
  id: 'virtualmachineimport',
};
