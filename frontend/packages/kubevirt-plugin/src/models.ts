import { K8sKind } from '@console/internal/module/k8s';

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

/* TODO(mlibra): migrate templates
export const VmTemplateModel: K8sKind = {
  label: 'Template',
  labelPlural: 'Templates',
  apiVersion: 'v1',
  path: 'templates',
  apiGroup: 'template.openshift.io',
  plural: 'vmtemplates',
  namespaced: true,
  abbr: 'VMT',
  kind: 'Template',
  id: 'vmtemplate',
  selector: {
    matchLabels: {[TEMPLATE_TYPE_LABEL]: 'vm'},
  },
};
*/

export const NetworkAttachmentDefinitionModel: K8sKind = {
  label: 'Network Attachment Definition',
  labelPlural: 'Network Attachment Definitions',
  apiVersion: 'v1',
  apiGroup: 'k8s.cni.cncf.io',
  plural: 'network-attachment-definitions',
  namespaced: true,
  abbr: 'NAD',
  kind: 'NetworkAttachmentDefinition',
  id: 'network-attachment-definition',
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
  apiGroup: 'kubevirt.io',
  plural: 'v2vvmwares',
  abbr: 'VVW',
  namespaced: true,
  kind: 'V2VVmware',
  id: 'v2vvmware',
};

export const NodeMaintenance: K8sKind = {
  label: 'NodeMaintenance',
  labelPlural: 'NodeMaintenances',
  apiVersion: 'v1alpha1',
  apiGroup: 'kubevirt.io',
  plural: 'nodemaintenances',
  abbr: 'NM',
  namespaced: false,
  kind: 'NodeMaintenance',
  id: 'nodemaintenance',
};
