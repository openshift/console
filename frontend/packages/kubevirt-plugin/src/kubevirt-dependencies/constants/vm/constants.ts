export enum DeviceType {
  NIC = 'NIC',
  DISK = 'DISK',
}

export const ANNOTATION_DESCRIPTION = 'description';
export const CUSTOM_FLAVOR = 'Custom';

export const TEMPLATE_FLAVOR_LABEL = 'flavor.template.kubevirt.io';
export const TEMPLATE_WORKLOAD_LABEL = 'workload.template.kubevirt.io';
export const TEMPLATE_OS_NAME_ANNOTATION = 'name.os.template.kubevirt.io';
export const TEMPLATE_OS_LABEL = 'os.template.kubevirt.io';
export const TEMPLATE_VM_NAME_LABEL = 'vm.kubevirt.io/name';

export const CLOUDINIT_DISK = 'cloudinitdisk';
export const CLOUD_INIT_CONFIG_DRIVE = 'cloudInitConfigDrive';
export const CLOUD_INIT_NO_CLOUD = 'cloudInitNoCloud';

export const LABEL_USED_TEMPLATE_NAME = 'vm.kubevirt.io/template';
export const LABEL_USED_TEMPLATE_NAMESPACE = 'vm.kubevirt.io/template.namespace';

export const ANNOTATION_FIRST_BOOT = 'kubevirt.ui/firstBoot';
export const BOOT_ORDER_FIRST = 1;
export const BOOT_ORDER_SECOND = 2;
