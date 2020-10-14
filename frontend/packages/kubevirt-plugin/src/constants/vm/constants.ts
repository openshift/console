export const VIRT_LAUNCHER_POD_PREFIX = 'virt-launcher-';
export const READABLE_VIRTIO = 'virtio';
export const ANNOTATION_FIRST_BOOT = 'kubevirt.ui/firstBoot';
export const ANNOTATION_DESCRIPTION = 'description';
export const ANNOTATION_PXE_INTERFACE = 'kubevirt.ui/pxeInterface';
export const ANNOTATION_VALIDATIONS = 'validations';
export const CUSTOM_FLAVOR = 'Custom';

export const APP = 'app';
export const BOOT_ORDER_FIRST = 1;
export const BOOT_ORDER_SECOND = 2;

export const TEMPLATE_FLAVOR_LABEL = 'flavor.template.kubevirt.io';
export const TEMPLATE_OS_LABEL = 'os.template.kubevirt.io';
export const TEMPLATE_PARAM_VM_NAME = 'NAME';
export const TEMPLATE_PARAM_VM_NAME_DESC = 'Name for the new VM';
export const TEMPLATE_TYPE_LABEL = 'template.kubevirt.io/type';
export const TEMPLATE_VERSION_LABEL = 'template.kubevirt.io/version';
export const TEMPLATE_TYPE_VM = 'vm';
export const TEMPLATE_TYPE_BASE = 'base';
export const TEMPLATE_WORKLOAD_LABEL = 'workload.template.kubevirt.io';
export const TEMPLATE_VM_NAME_LABEL = 'vm.kubevirt.io/name';
export const TEMPLATE_OS_NAME_ANNOTATION = 'name.os.template.kubevirt.io';
export const TEMPLATE_BASE_IMAGE_NAME_PARAMETER = 'SRC_PVC_NAME';
export const TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER = 'SRC_PVC_NAMESPACE';
export const TEMPLATE_VM_DOMAIN_LABEL = 'kubevirt.io/domain';
export const TEMPLATE_VM_SIZE_LABEL = 'kubevirt.io/size';
export const TEMPLATE_VM_COMMON_NAMESPACE = 'openshift';

export const LABEL_USED_TEMPLATE_NAME = 'vm.kubevirt.io/template';
export const LABEL_USED_TEMPLATE_NAMESPACE = 'vm.kubevirt.io/template.namespace';

export const DEFAULT_RDP_PORT = 3389;

export const VM_DETAIL_DETAILS_HREF = 'details';
export const VM_DETAIL_DISKS_HREF = 'disks';
export const VM_DETAIL_NETWORKS_HREF = 'nics';
export const VM_DETAIL_CONSOLES_HREF = 'console';
export const VM_DETAIL_ENVIRONMENT = 'environment';
export const VM_DETAIL_SNAPSHOTS = 'snapshots';

export const CLOUDINIT_DISK = 'cloudinitdisk';

export const OS_WINDOWS_PREFIX = 'win';

export enum DeviceType {
  NIC = 'NIC',
  DISK = 'DISK',
}

export const VM_DETAIL_EVENTS_HREF = 'events';

export const DUMMY_VM_NAME = 'vm';

export const WINTOOLS_CONTAINER_NAMES = {
  openshift: 'registry.redhat.io/container-native-virtualization/virtio-win',
  ocp: 'registry.redhat.io/container-native-virtualization/virtio-win',
  online: 'registry.redhat.io/container-native-virtualization/virtio-win',
  dedicated: 'registry.redhat.io/container-native-virtualization/virtio-win',
  azure: 'registry.redhat.io/container-native-virtualization/virtio-win',
  okd: 'kubevirt/virtio-container-disk',
};

export const PENDING_RESTART_LABEL = '(pending restart)';
export const getPVCUploadURL = (pvcNamespace: string): string =>
  `/k8s/ns/${pvcNamespace}/persistentvolumeclaims/~new/upload-form`;
