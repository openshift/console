import {
  VMSettingsField,
  VMSettingsRenderableField,
  VMSettingsRenderableFieldResolver,
} from '../types';
import { titleResolver, placeholderResolver, helpResolver } from '../strings/vm-settings';

const idResolver: VMSettingsRenderableFieldResolver = {
  [VMSettingsField.NAME]: 'vm-name',
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
  [VMSettingsField.USE_CLOUD_INIT]: 'use-cloud-init',
  [VMSettingsField.USE_CLOUD_INIT_CUSTOM_SCRIPT]: 'use-cloud-init-custom-script',
  [VMSettingsField.HOST_NAME]: 'cloud-init-hostname',
  [VMSettingsField.AUTHKEYS]: 'cloud-init-ssh',
  [VMSettingsField.CLOUD_INIT_CUSTOM_SCRIPT]: 'cloud-init-custom-script',
};

export const getFieldId = (key: VMSettingsRenderableField) => idResolver[key];
export const getFieldTitle = (key: VMSettingsRenderableField) => titleResolver[key];
export const getPlaceholder = (key: VMSettingsRenderableField) => placeholderResolver[key];
export const getFieldHelp = (key: VMSettingsRenderableField, value: string) => {
  const resolveFunction = helpResolver[key];
  return resolveFunction ? resolveFunction(value) : null;
};
