export const VIRT_LAUNCHER_POD_PREFIX = 'virt-launcher-';
export const BUS_VIRTIO = 'virtio';
export const READABLE_VIRTIO = 'VirtIO';
export const ANNOTATION_FIRST_BOOT = 'kubevirt.ui/firstBoot';
export const ANNOTATION_DESCRIPTION = 'description';
export const ANNOTATION_PXE_INTERFACE = 'kubevirt.ui/pxeInterface';
export const CUSTOM_FLAVOR = 'Custom';

export const APP = 'app';
export const BOOT_ORDER_FIRST = 1;
export const BOOT_ORDER_SECOND = 2;

export const TEMPLATE_FLAVOR_LABEL = 'flavor.template.kubevirt.io';
export const TEMPLATE_OS_LABEL = 'os.template.kubevirt.io';
export const TEMPLATE_PARAM_VM_NAME = 'NAME';
export const TEMPLATE_PARAM_VM_NAME_DESC = 'Name for the new VM';
export const TEMPLATE_TYPE_LABEL = 'template.kubevirt.io/type';
export const TEMPLATE_TYPE_VM = 'vm';
export const TEMPLATE_TYPE_BASE = 'base';
export const TEMPLATE_WORKLOAD_LABEL = 'workload.template.kubevirt.io';
export const TEMPLATE_VM_NAME_LABEL = 'vm.kubevirt.io/name';
export const TEMPLATE_OS_NAME_ANNOTATION = 'name.os.template.kubevirt.io';
export const TEMPLATE_VM_DOMAIN_LABEL = 'kubevirt.io/domain';

export const LABEL_USED_TEMPLATE_NAME = 'vm.kubevirt.io/template';
export const LABEL_USED_TEMPLATE_NAMESPACE = 'vm.kubevirt.io/template.namespace';
export const LABEL_TEMPLATE_REVISION = 'vm.kubevirt.io/template.revision';
export const LABEL_TEMPLATE_VERSION = 'vm.kubevirt.io/template.version';

export const DEFAULT_RDP_PORT = 3389;

export const VM_DETAIL_DETAILS_HREF = 'details';
export const VM_DETAIL_DISKS_HREF = 'disks';
export const VM_DETAIL_NETWORKS_HREF = 'nics';
export const VM_DETAIL_CONSOLES_HREF = 'consoles';
export const VM_DETAIL_ENVIRONMENT = 'environment';

export const CLOUDINIT_DISK = 'cloudinitdisk';

export const OS_WINDOWS_PREFIX = 'win';

export enum DeviceType {
  NIC = 'NIC',
  DISK = 'DISK',
}

export const VM_DETAIL_EVENTS_HREF = 'events';

export const PAUSED_VM_MODAL_MESSAGE =
  'This VM has been paused. If you wish to unpause it, please click the Unpause button below. For further details, please check with your system administrator.';
