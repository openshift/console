import {
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
  RenderableFieldResolver,
  VMWareProviderField,
  OvirtProviderField,
} from '../types';

export const titleKeyResolver: RenderableFieldResolver = {
  // t('kubevirt-plugin~RHV Instance')
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'kubevirt-plugin~RHV Instance',
  // t('kubevirt-plugin~API URL')
  [OvirtProviderField.API_URL]: 'kubevirt-plugin~API URL',
  // t('kubevirt-plugin~CA certificate')
  [OvirtProviderField.CERTIFICATE]: 'kubevirt-plugin~CA certificate',
  // t('kubevirt-plugin~Username')
  [OvirtProviderField.USERNAME]: 'kubevirt-plugin~Username',
  // t('kubevirt-plugin~Password')
  [OvirtProviderField.PASSWORD]: 'kubevirt-plugin~Password',
  // t('kubevirt-plugin~Save as new RHV Instance secret')
  [OvirtProviderField.REMEMBER_PASSWORD]: 'kubevirt-plugin~Save as new RHV Instance secret',
  // t('kubevirt-plugin~Cluster')
  [OvirtProviderField.CLUSTER]: 'kubevirt-plugin~Cluster',
  // t('kubevirt-plugin~VM to Import')
  [OvirtProviderField.VM]: 'kubevirt-plugin~VM to Import',
  [OvirtProviderField.STATUS]: '',
  // t('kubevirt-plugin~Provider')
  [ImportProvidersField.PROVIDER]: 'kubevirt-plugin~Provider',
  // t('kubevirt-plugin~vCenter instance')
  [VMWareProviderField.VCENTER_SECRET_NAME]: 'kubevirt-plugin~vCenter instance',
  // t('kubevirt-plugin~vCenter hostname')
  [VMWareProviderField.HOSTNAME]: 'kubevirt-plugin~vCenter hostname',
  // t('kubevirt-plugin~Username')
  [VMWareProviderField.USERNAME]: 'kubevirt-plugin~Username',
  // t('kubevirt-plugin~Password')
  [VMWareProviderField.PASSWORD]: 'kubevirt-plugin~Password',
  // t('kubevirt-plugin~Save as new vCenter instance secret')
  [VMWareProviderField.REMEMBER_PASSWORD]: 'kubevirt-plugin~Save as new vCenter instance secret',
  [VMWareProviderField.STATUS]: '',
  // t('kubevirt-plugin~VM or Template to Import')
  [VMWareProviderField.VM]: 'kubevirt-plugin~VM or Template to Import',
  // t('kubevirt-plugin~Name')
  [VMSettingsField.NAME]: 'kubevirt-plugin~Name',
  // t('kubevirt-plugin~Description')
  [VMSettingsField.DESCRIPTION]: 'kubevirt-plugin~Description',
  // t('kubevirt-plugin~Operating System')
  [VMSettingsField.OPERATING_SYSTEM]: 'kubevirt-plugin~Operating System',
  // t('kubevirt-plugin~Clone available operating system source to this Virtual Machine')
  [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE]:
    'kubevirt-plugin~Clone available operating system source to this Virtual Machine',
  // t('kubevirt-plugin~Mount Windows guest tools')
  [VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS]: 'kubevirt-plugin~Mount Windows guest tools',
  // t('kubevirt-plugin~Flavor')
  [VMSettingsField.FLAVOR]: 'kubevirt-plugin~Flavor',
  // t('kubevirt-plugin~Memory')
  [VMSettingsField.MEMORY]: 'kubevirt-plugin~Memory',
  // t('kubevirt-plugin~CPUs')
  [VMSettingsField.CPU]: 'kubevirt-plugin~CPUs',
  // t('kubevirt-plugin~Workload Type')
  [VMSettingsField.WORKLOAD_PROFILE]: 'kubevirt-plugin~Workload Type',
  // t('kubevirt-plugin~Boot Source')
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'kubevirt-plugin~Boot Source',
  // t('kubevirt-plugin~Container Image')
  [VMSettingsField.CONTAINER_IMAGE]: 'kubevirt-plugin~Container Image',
  // t('kubevirt-plugin~URL')
  [VMSettingsField.IMAGE_URL]: 'kubevirt-plugin~URL',
  // t('kubevirt-plugin~Start virtual machine on creation')
  [VMSettingsField.START_VM]: 'kubevirt-plugin~Start virtual machine on creation',
  // t('kubevirt-plugin~Template provider')
  [VMSettingsField.TEMPLATE_PROVIDER]: 'kubevirt-plugin~Template provider',
  // t('kubevirt-plugin~Template support')
  [VMSettingsField.TEMPLATE_SUPPORTED]: 'kubevirt-plugin~Template support',
  // t('kubevirt-plugin~Persistent Volume Claim project')
  [VMSettingsField.CLONE_PVC_NS]: 'kubevirt-plugin~Persistent Volume Claim project',
  // t('kubevirt-plugin~Persistent Volume Claim name')
  [VMSettingsField.CLONE_PVC_NAME]: 'kubevirt-plugin~Persistent Volume Claim name',
};

export const placeholderKeyResolver = {
  // t('kubevirt-plugin~--- Select Provider ---')
  [ImportProvidersField.PROVIDER]: 'kubevirt-plugin~--- Select Provider ---',
  // t('kubevirt-plugin~--- Select RHV Instance ---')
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'kubevirt-plugin~--- Select RHV Instance ---',
  // t('kubevirt-plugin~--- Select Cluster ---')
  [OvirtProviderField.CLUSTER]: 'kubevirt-plugin~--- Select Cluster ---',
  // t('kubevirt-plugin~--- Select VM ---')
  [OvirtProviderField.VM]: 'kubevirt-plugin~--- Select VM ---',
  // t('kubevirt-plugin~--- Select vCenter Instance ---')
  [VMWareProviderField.VCENTER_SECRET_NAME]: 'kubevirt-plugin~--- Select vCenter Instance ---',
  // t('kubevirt-plugin~--- Select VM or Template ---')
  [VMWareProviderField.VM]: 'kubevirt-plugin~--- Select VM or Template ---',
  // t('kubevirt-plugin~--- Select Operating System ---')
  [VMSettingsField.OPERATING_SYSTEM]: 'kubevirt-plugin~--- Select Operating System ---',
  // t('kubevirt-plugin~--- Select Flavor ---')
  [VMSettingsField.FLAVOR]: 'kubevirt-plugin~--- Select Flavor ---',
  // t('kubevirt-plugin~--- Select Workload Type ---')
  [VMSettingsField.WORKLOAD_PROFILE]: 'kubevirt-plugin~--- Select Workload Type ---',
  // t('kubevirt-plugin~--- Select Source ---')
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'kubevirt-plugin~--- Select Source ---',
};

const providerHelpKeyResolver = {
  // t('kubevirt-plugin~The virtual machine will be imported from a vCenter instance. Please provide connection details and select the virtual machine.')
  [VMImportProvider.VMWARE]:
    'kubevirt-plugin~The virtual machine will be imported from a vCenter instance. Please provide connection details and select the virtual machine.',
};

export const helpKeyResolver = {
  [ImportProvidersField.PROVIDER]: (provider) => providerHelpKeyResolver[provider],
  // t('kubevirt-plugin~Should be in the following format: admin@internal')
  [OvirtProviderField.USERNAME]: () =>
    'kubevirt-plugin~Should be in the following format: admin@internal',
  // t('kubevirt-plugin~Select secret containing connection details for RHV API.')
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: () =>
    'kubevirt-plugin~Select secret containing connection details for RHV API.',
  // t('kubevirt-plugin~Select secret containing connection details for a vCenter instance.')
  [VMWareProviderField.VCENTER_SECRET_NAME]: () =>
    'kubevirt-plugin~Select secret containing connection details for a vCenter instance.',
  // t('kubevirt-plugin~Address to be used for connection to a vCenter instance. The "https://" protocol will be added automatically. Example: "my.domain.com:1234".')
  [VMWareProviderField.HOSTNAME]: () =>
    'kubevirt-plugin~Address to be used for connection to a vCenter instance. The "https://" protocol will be added automatically. Example: "my.domain.com:1234".',
  // t('kubevirt-plugin~User name to be used for connection to a vCenter instance.')
  [VMWareProviderField.USERNAME]: () =>
    'kubevirt-plugin~User name to be used for connection to a vCenter instance.',
  // t('kubevirt-plugin~User password to be used for connection to a vCenter instance.')
  [VMWareProviderField.PASSWORD]: () =>
    'kubevirt-plugin~User password to be used for connection to a vCenter instance.',
  // t('kubevirt-plugin~Select a vCenter virtual machine to import. Loading of their list might take some time. The list will be enabled for selection once data are loaded.')
  [VMWareProviderField.VM]: () =>
    'kubevirt-plugin~Select a vCenter virtual machine to import. Loading of their list might take some time. The list will be enabled for selection once data are loaded.',
  // t('kubevirt-plugin~The combination of processing power and memory that will be provided to the virtual machine.')
  [VMSettingsField.FLAVOR]: () =>
    'kubevirt-plugin~The combination of processing power and memory that will be provided to the virtual machine.',
  // t('kubevirt-plugin~The amount of memory that will be dedicated to the virtual machine.')
  [VMSettingsField.MEMORY]: () =>
    'kubevirt-plugin~The amount of memory that will be dedicated to the virtual machine.',
  // t('kubevirt-plugin~The number of virtual CPU cores that will be dedicated to the virtual machine.')
  [VMSettingsField.CPU]: () =>
    'kubevirt-plugin~The number of virtual CPU cores that will be dedicated to the virtual machine.',
  // t('kubevirt-plugin~The category of workload that this virtual machine will be used for.')
  [VMSettingsField.WORKLOAD_PROFILE]: () =>
    'kubevirt-plugin~The category of workload that this virtual machine will be used for.',
  // t('kubevirt-plugin~Select a method of adding an operating system image source')
  [VMSettingsField.PROVISION_SOURCE_TYPE]: () =>
    'kubevirt-plugin~Select a method of adding an operating system image source',
  // t('kubevirt-plugin~Clarifies who created this template on the cluster')
  [VMSettingsField.TEMPLATE_PROVIDER]: () =>
    'kubevirt-plugin~Clarifies who created this template on the cluster',
  // t('kubevirt-plugin~Clarifies who supports this template on the cluster')
  [VMSettingsField.TEMPLATE_SUPPORTED]: () =>
    'kubevirt-plugin~Clarifies who supports this template on the cluster',
};
