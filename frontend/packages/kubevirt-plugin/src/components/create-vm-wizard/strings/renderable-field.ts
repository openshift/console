import {
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
  RenderableFieldResolver,
  VMWareProviderField,
  OvirtProviderField,
} from '../types';
import { ProvisionSource } from '../../../constants/vm/provision-source';

export const titleResolver: RenderableFieldResolver = {
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'RHV Instance',
  [OvirtProviderField.API_URL]: 'API URL',
  [OvirtProviderField.CERTIFICATE]: 'CA certificate',
  [OvirtProviderField.USERNAME]: 'Username',
  [OvirtProviderField.PASSWORD]: 'Password',
  [OvirtProviderField.REMEMBER_PASSWORD]: 'Save as new RHV Instance secret',
  [OvirtProviderField.CLUSTER]: 'Cluster',
  [OvirtProviderField.VM]: 'VM to Import',
  [OvirtProviderField.STATUS]: '',
  [ImportProvidersField.PROVIDER]: 'Provider',
  [VMWareProviderField.VCENTER_SECRET_NAME]: 'vCenter instance',
  [VMWareProviderField.HOSTNAME]: 'vCenter hostname',
  [VMWareProviderField.USERNAME]: 'Username',
  [VMWareProviderField.PASSWORD]: 'Password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'Save as new vCenter instance secret',
  [VMWareProviderField.STATUS]: '',
  [VMWareProviderField.VM]: 'VM or Template to Import',
  [VMSettingsField.NAME]: 'Name',
  [VMSettingsField.DESCRIPTION]: 'Description',
  [VMSettingsField.USER_TEMPLATE]: 'Template',
  [VMSettingsField.OPERATING_SYSTEM]: 'Operating System',
  [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE]: 'Clone available operating system source',
  [VMSettingsField.FLAVOR]: 'Flavor',
  [VMSettingsField.MEMORY]: 'Memory',
  [VMSettingsField.CPU]: 'CPUs',
  [VMSettingsField.WORKLOAD_PROFILE]: 'Workload Profile',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'Source',
  [VMSettingsField.CONTAINER_IMAGE]: 'Container Image',
  [VMSettingsField.IMAGE_URL]: 'URL',
  [VMSettingsField.START_VM]: 'Start virtual machine on creation',
};

export const placeholderResolver = {
  [ImportProvidersField.PROVIDER]: '--- Select Provider ---',
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: '--- Select RHV Instance ---',
  [OvirtProviderField.CLUSTER]: '--- Select Cluster ---',
  [OvirtProviderField.VM]: '--- Select VM ---',
  [VMWareProviderField.VCENTER_SECRET_NAME]: '--- Select vCenter Instance ---',
  [VMWareProviderField.VM]: '--- Select VM or Template ---',
  [VMSettingsField.USER_TEMPLATE]: '--- Select Template ---',
  [VMSettingsField.OPERATING_SYSTEM]: '--- Select Operating System ---',
  [VMSettingsField.FLAVOR]: '--- Select Flavor ---',
  [VMSettingsField.WORKLOAD_PROFILE]: '--- Select Workload Profile ---',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: '--- Select Source ---',
};

const provisionSourceHelpResolver = {
  [ProvisionSource.URL.getValue()]: 'An external URL to the .iso, .img, .qcow2 or .raw that the virtual machine should be created from.',
  [ProvisionSource.PXE.getValue()]: 'Discover provisionable virtual machines over the network.',
  [ProvisionSource.CONTAINER.getValue()]: 'Ephemeral virtual machine disk image which will be pulled from container registry.',
  [ProvisionSource.DISK.getValue()]: 'Select an existing PVC in Storage tab',
};

const providerHelpResolver = {
  [VMImportProvider.VMWARE]:
    'The virtual machine will be imported from a vCenter instance. Please provide connection details and select the virtual machine.',
};

export const helpResolver = {
  [ImportProvidersField.PROVIDER]: (provider) => providerHelpResolver[provider],
  [OvirtProviderField.USERNAME]: () => 'Should be in the following format: admin@internal',
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: () =>
    'Select secret containing connection details for RHV API.',
  [VMWareProviderField.VCENTER_SECRET_NAME]: () =>
    'Select secret containing connection details for a vCenter instance.',
  [VMWareProviderField.HOSTNAME]: () =>
    'Address to be used for connection to a vCenter instance. The "https://" protocol will be added automatically. Example: "my.domain.com:1234".',
  [VMWareProviderField.USERNAME]: () =>
    'User name to be used for connection to a vCenter instance.',
  [VMWareProviderField.PASSWORD]: () =>
    'User password to be used for connection to a vCenter instance.',
  [VMWareProviderField.VM]: () =>
    'Select a vCenter virtual machine to import. Loading of their list might take some time. The list will be enabled for selection once data are loaded.',
  [VMSettingsField.FLAVOR]: () =>
    'The combination of processing power and memory that will be provided to the virtual machine.',
  [VMSettingsField.MEMORY]: () =>
    'The amount of memory that will be dedicated to the virtual machine.',
  [VMSettingsField.CPU]: () =>
    'The number of virtual CPU cores that will be dedicated to the virtual machine.',
  [VMSettingsField.WORKLOAD_PROFILE]: () =>
    'The category of workload that this virtual machine will be used for.',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: (sourceType: string) =>
    provisionSourceHelpResolver[sourceType],
};
