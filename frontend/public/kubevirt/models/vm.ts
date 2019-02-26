// eslint-disable-next-line no-unused-vars
import { K8sKind } from '../../module/k8s';
import { TEMPLATE_TYPE_LABEL } from 'kubevirt-web-ui-components';

// TODO: reuse following from kubevirt-web-ui-components to avoid duplicity

export const VirtualMachineModel: K8sKind = {
  label: 'Virtual Machine',
  labelPlural: 'Virtual Machines',
  apiVersion: 'v1alpha3',
  path: 'virtualmachines',
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
  path: 'virtualmachineinstances',
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
  path: 'virtualmachineinstancepresets',
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
  path: 'virtualmachineinstancereplicaset',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachineinstancereplicasets',
  abbr: 'VMIRS',
  namespaced: true,
  kind: 'VirtualMachineInstanceReplicaSet',
  id: 'virtualmachineinstancereplicaset',
};

export const TemplateModel: K8sKind = {
  label: 'Template',
  labelPlural: 'Templates',
  apiVersion: 'v1',
  path: 'templates',
  apiGroup: 'template.openshift.io',
  plural: 'templates',
  namespaced: true,
  abbr: 'Template',
  kind: 'Template',
  id: 'template',
};

export const VmTemplateModel: K8sKind = {
  label: 'Template',
  labelPlural: 'Templates',
  apiVersion: 'v1',
  path: 'templates',
  apiGroup: 'template.openshift.io',
  plural: 'templates',
  namespaced: true,
  abbr: 'VMT',
  kind: 'Template',
  id: 'vmtemplate',
  selector: {
    matchLabels: {[TEMPLATE_TYPE_LABEL]: 'vm'},
  },
};

export const NetworkAttachmentDefinitionModel: K8sKind = {
  label: 'Network Attachment Definition',
  labelPlural: 'Network Attachment Definitions',
  apiVersion: 'v1',
  path: 'network-attachment-definitions',
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
  path: 'virtualmachineinstancemigrations',
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
  path: 'datavolumes',
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
  path: 'v2vvmwares',
  apiGroup: 'kubevirt.io',
  plural: 'v2vvmwares',
  abbr: 'v2vVmw',
  namespaced: true,
  kind: 'V2VVmware',
  id: 'v2vvmware',
};
