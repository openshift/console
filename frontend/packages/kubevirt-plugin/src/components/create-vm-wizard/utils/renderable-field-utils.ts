import { iGetFieldKey } from '../selectors/immutable/field';
import {
  helpKeyResolver,
  placeholderKeyResolver,
  titleKeyResolver,
} from '../strings/renderable-field';
import {
  ImportProvidersField,
  OvirtProviderField,
  RenderableField,
  RenderableFieldResolver,
  VMSettingsField,
  VMWareProviderField,
} from '../types';

const renderableFieldOrder: { [key in RenderableField]: number } = {
  [ImportProvidersField.PROVIDER]: 0,
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 1,
  [OvirtProviderField.API_URL]: 2,
  [OvirtProviderField.CERTIFICATE]: 3,
  [OvirtProviderField.USERNAME]: 4,
  [OvirtProviderField.PASSWORD]: 5,
  [OvirtProviderField.REMEMBER_PASSWORD]: 6,
  [OvirtProviderField.CLUSTER]: 7,
  [OvirtProviderField.VM]: 8,
  [OvirtProviderField.STATUS]: 9,
  [ImportProvidersField.PROVIDER]: 10,
  [VMWareProviderField.VCENTER_SECRET_NAME]: 11,
  [VMWareProviderField.HOSTNAME]: 12,
  [VMWareProviderField.USERNAME]: 13,
  [VMWareProviderField.PASSWORD]: 14,
  [VMWareProviderField.REMEMBER_PASSWORD]: 15,
  [VMWareProviderField.VM]: 16,
  [VMWareProviderField.STATUS]: 17,
  [VMSettingsField.NAME]: 18,
  [VMSettingsField.TEMPLATE_PROVIDER]: 19,
  [VMSettingsField.TEMPLATE_SUPPORTED]: 20,
  [VMSettingsField.DESCRIPTION]: 21,
  [VMSettingsField.OPERATING_SYSTEM]: 22,
  [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE]: 23,
  [VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS]: 24,
  [VMSettingsField.CLONE_PVC_NS]: 25,
  [VMSettingsField.CLONE_PVC_NAME]: 26,
  [VMSettingsField.FLAVOR]: 27,
  [VMSettingsField.MEMORY]: 28,
  [VMSettingsField.CPU]: 29,
  [VMSettingsField.WORKLOAD_PROFILE]: 30,
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 31,
  [VMSettingsField.CONTAINER_IMAGE]: 32,
  [VMSettingsField.IMAGE_URL]: 33,
  [VMSettingsField.START_VM]: 34,
  [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE_TEMPLATE]: 35,
  [VMSettingsField.IS_CDROM_BOOT_SOURCE]: 36,
};

const idResolver: RenderableFieldResolver = {
  [ImportProvidersField.PROVIDER]: 'provider-dropdown',
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'ovirt-engine-dropdown',
  [OvirtProviderField.API_URL]: 'ovirt-engine-api-url',
  [OvirtProviderField.CERTIFICATE]: 'ovirt-engine-certificate',
  [OvirtProviderField.USERNAME]: 'ovirt-engine-username',
  [OvirtProviderField.PASSWORD]: 'ovirt-engine-password',
  [OvirtProviderField.REMEMBER_PASSWORD]: 'ovirt-engine-remember-credentials',
  [OvirtProviderField.CLUSTER]: 'ovirt-cluster-dropdown',
  [OvirtProviderField.VM]: 'ovirt-vm-dropdown',
  [OvirtProviderField.STATUS]: 'ovirt-engine-status',
  [VMWareProviderField.VCENTER_SECRET_NAME]: 'vcenter-instance-dropdown',
  [VMWareProviderField.HOSTNAME]: 'vcenter-hostname-dropdown',
  [VMWareProviderField.USERNAME]: 'vcenter-username',
  [VMWareProviderField.PASSWORD]: 'vcenter-password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'vcenter-remember-credentials',
  [VMWareProviderField.STATUS]: 'vcenter-status',
  [VMWareProviderField.VM]: 'vcenter-vm-dropdown',
  [VMSettingsField.NAME]: 'vm-name',
  [VMSettingsField.DESCRIPTION]: 'vm-description',
  [VMSettingsField.OPERATING_SYSTEM]: 'operating-system-dropdown',
  [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE]: 'clone-common-base-image-checkbox',
  [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE_TEMPLATE]:
    'clone-common-base-image-template-checkbox',
  [VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS]: 'mount-windows-guest-tools-checkbox',
  [VMSettingsField.FLAVOR]: 'flavor-dropdown',
  [VMSettingsField.MEMORY]: 'resources-memory',
  [VMSettingsField.CPU]: 'resources-cpu',
  [VMSettingsField.WORKLOAD_PROFILE]: 'workload-profile-dropdown',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'image-source-type-dropdown',
  [VMSettingsField.CONTAINER_IMAGE]: 'provision-source-container',
  [VMSettingsField.IMAGE_URL]: 'provision-source-url',
  [VMSettingsField.START_VM]: 'start-vm',
  [VMSettingsField.TEMPLATE_PROVIDER]: 'template-provider',
  [VMSettingsField.TEMPLATE_SUPPORTED]: 'template-supported',
  [VMSettingsField.CLONE_PVC_NS]: 'clone-pvc-ns',
  [VMSettingsField.CLONE_PVC_NAME]: 'clone-pvc-name',
  [VMSettingsField.IS_CDROM_BOOT_SOURCE]: 'cdrom-boot-source-checkbox',
};

export const getFieldId = (key: RenderableField) => idResolver[key];
export const getFieldTitleKey = (key: RenderableField) => titleKeyResolver[key];
export const getPlaceholderKey = (key: RenderableField) => placeholderKeyResolver[key];
export const getFieldHelpKey = (key: RenderableField, value: string) => {
  const resolveFunction = helpKeyResolver[key];
  return resolveFunction ? resolveFunction(value) : null;
};

export const sortFields = (fields: any[]) =>
  fields.sort((a, b) => {
    const aValue = renderableFieldOrder[iGetFieldKey(a)];
    const bValue = renderableFieldOrder[iGetFieldKey(b)];

    if (bValue == null) {
      return -1;
    }

    if (aValue == null) {
      return 1;
    }

    return aValue - bValue;
  });
