import { VMSettingsField, VMSettingsRenderableFieldResolver } from '../types';
import { ProvisionSource } from '../../../constants/vm/provision-source';

export const titleResolver: VMSettingsRenderableFieldResolver = {
  [VMSettingsField.NAME]: 'Name',
  [VMSettingsField.DESCRIPTION]: 'Description',
  [VMSettingsField.USER_TEMPLATE]: 'Template',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'Source',
  [VMSettingsField.PROVIDER]: 'Provider',
  [VMSettingsField.CONTAINER_IMAGE]: 'Container Image',
  [VMSettingsField.IMAGE_URL]: 'URL',
  [VMSettingsField.OPERATING_SYSTEM]: 'Operating System',
  [VMSettingsField.FLAVOR]: 'Flavor',
  [VMSettingsField.MEMORY]: 'Memory (GB)',
  [VMSettingsField.CPU]: 'CPUs',
  [VMSettingsField.WORKLOAD_PROFILE]: 'Workload Profile',
  [VMSettingsField.START_VM]: 'Start virtual machine on creation',
  [VMSettingsField.USE_CLOUD_INIT]: 'Use cloud-init',
  [VMSettingsField.USE_CLOUD_INIT_CUSTOM_SCRIPT]: 'Use custom script',
  [VMSettingsField.HOST_NAME]: 'Hostname',
  [VMSettingsField.AUTHKEYS]: 'Authenticated SSH Keys',
  [VMSettingsField.CLOUD_INIT_CUSTOM_SCRIPT]: 'Custom Script',
};

export const placeholderResolver = {
  [VMSettingsField.USER_TEMPLATE]: '--- Select Template ---',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: '--- Select Source ---',
  [VMSettingsField.PROVIDER]: '--- Select Provider ---',
  [VMSettingsField.OPERATING_SYSTEM]: '--- Select Operating System ---',
  [VMSettingsField.FLAVOR]: '--- Select Flavor ---',
  [VMSettingsField.WORKLOAD_PROFILE]: '--- Select Workload Profile ---',
};

const provisionSourceHelpResolver = {
  [ProvisionSource.URL.getValue()]: 'An external URL to the .iso, .img, .qcow2 or .raw that the virtual machine should be created from.',
  [ProvisionSource.PXE.getValue()]: 'Discover provisionable virtual machines over the network.',
  [ProvisionSource.CONTAINER.getValue()]: 'Ephemeral virtual machine disk image which will be pulled from container registry.',
  [ProvisionSource.IMPORT.getValue()]: 'Import a virtual machine from external service using a provider.',
  [ProvisionSource.DISK.getValue()]: 'Select an existing PVC in Storage tab',
};

export const helpResolver = {
  [VMSettingsField.PROVISION_SOURCE_TYPE]: (sourceType: string) =>
    provisionSourceHelpResolver[sourceType],
  [VMSettingsField.PROVIDER]: (provider) => `Not Implemented for ${provider}!!!`,
  [VMSettingsField.FLAVOR]: () =>
    'The combination of processing power and memory that will be provided to the virtual machine.',
  [VMSettingsField.MEMORY]: () =>
    'The amount of memory that will be dedicated to the virtual machine.',
  [VMSettingsField.CPU]: () =>
    'The number of virtual CPU cores that will be dedicated to the virtual machine.',
  [VMSettingsField.WORKLOAD_PROFILE]: () =>
    'The category of workload that this virtual machine will be used for.',
};
