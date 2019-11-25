import {
  VMSettingsField,
  VMSettingsRenderableField,
  VMSettingsRenderableFieldResolver,
  VMWareProviderField,
} from '../types';
import { titleResolver, placeholderResolver, helpResolver } from '../strings/vm-settings';

const idResolver: VMSettingsRenderableFieldResolver = {
  [VMWareProviderField.VCENTER]: 'vcenter-instance-dropdown',
  [VMWareProviderField.HOSTNAME]: 'vcenter-hostname-dropdown',
  [VMWareProviderField.USER_NAME]: 'vcenter-username',
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 'vcenter-password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'vcenter-remember-credentials',
  [VMWareProviderField.STATUS]: 'vcenter-status',
  [VMWareProviderField.VM]: 'vcenter-vm-dropdown',
  [VMSettingsField.NAME]: 'vm-name',
  [VMSettingsField.HOSTNAME]: 'vm-hostname',
  [VMSettingsField.DESCRIPTION]: 'vm-description',
  [VMSettingsField.USER_TEMPLATE]: 'template-dropdown',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'image-source-type-dropdown',
  [VMSettingsField.PROVIDER]: 'provider-dropdown',
  [VMSettingsField.CONTAINER_IMAGE]: 'provision-source-container',
  [VMSettingsField.IMAGE_URL]: 'provision-source-url',
  [VMSettingsField.OPERATING_SYSTEM]: 'operating-system-dropdown',
  [VMSettingsField.FLAVOR]: 'flavor-dropdown',
  [VMSettingsField.MEMORY]: 'resources-memory',
  [VMSettingsField.CPU]: 'resources-cpu',
  [VMSettingsField.WORKLOAD_PROFILE]: 'workload-profile-dropdown',
  [VMSettingsField.START_VM]: 'start-vm',
};

export const getFieldId = (key: VMSettingsRenderableField | VMWareProviderField) => idResolver[key];
export const getFieldTitle = (key: VMSettingsRenderableField | VMWareProviderField) =>
  titleResolver[key];
export const getFieldReadableTitle = (key: VMSettingsRenderableField | VMWareProviderField) => {
  if (key === VMSettingsField.MEMORY) {
    return 'Memory';
  }
  return titleResolver[key];
};
export const getPlaceholder = (key: VMSettingsRenderableField | VMWareProviderField) =>
  placeholderResolver[key];
export const getFieldHelp = (
  key: VMSettingsRenderableField | VMWareProviderField,
  value: string,
) => {
  const resolveFunction = helpResolver[key];
  return resolveFunction ? resolveFunction(value) : null;
};
