export const VIRT_LAUNCHER_POD_PREFIX = 'virt-launcher-';
export const ANNOTATION_FIRST_BOOT = 'kubevirt.ui/firstBoot';
export const ANNOTATION_DESCRIPTION = 'description';
export const ANNOTATION_PXE_INTERFACE = 'kubevirt.ui/pxeInterface';
export const ANNOTATION_VALIDATIONS = 'validations';
export const ANNOTATION_ICON = 'iconClass';
export const LABEL_CDROM_SOURCE = 'kubevirt.ui/cdrom';
export const ANNOTATION_SOURCE_PROVIDER = 'kubevirt.ui/provider';
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
export const TEMPLATE_DEFAULT_LABEL = 'template.kubevirt.io/default-os-variant';
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
export const TEMPLATE_PROVIDER_ANNOTATION = 'template.kubevirt.io/provider';
export const TEMPLATE_PROVIDER_URL = 'template.kubevirt.io/provider-url';
export const TEMPLATE_SUPPORT_LEVEL = 'template.kubevirt.io/provider-support-level';
export const TEMPLATE_PARENT_PROVIDER_ANNOTATION = 'template.kubevirt.ui/parent-provider';
export const TEMPLATE_PARENT_SUPPORT_LEVEL = 'template.kubevirt.ui/parent-support-level';
export const TEMPLATE_PARENT_PROVIDER_URL = 'template.kubevirt.ui/parent-provider-url';
export const TEMPLATE_DEPRECATED_ANNOTATION = 'template.kubevirt.io/deprecated';
export const TEMPLATE_CUSTOMIZED_ANNOTATION = 'template.kubevirt.ui/customized-template';
export const VM_CUSTOMIZE_LABEL = 'template.kubevirt.ui/customize-vm';

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
export const CLOUD_INIT_CONFIG_DRIVE = 'cloudInitConfigDrive';
export const CLOUD_INIT_NO_CLOUD = 'cloudInitNoCloud';

export const OS_WINDOWS_PREFIX = 'win';

export enum DeviceType {
  NIC = 'NIC',
  DISK = 'DISK',
}

export const VM_DETAIL_EVENTS_HREF = 'events';

export const DUMMY_VM_NAME = 'vm';

// NOTE(yaacov):
// BZ 1944273, wintool container version should matches the "latest" image at the time of the release
// Bug 1942839, container images should use digest for competability with disconnected enviorments
//
// To get the image's digest you could the following steps:
//
// * Step 1:
// skopeo login registry.redhat.io
// Login Succeeded!
//
// * Step 2: skopeo inspect docker://registry.redhat.io/container-native-virtualization/virtio-win:v2.6.0 | jq '.Digest'
// "sha256:011060472f068e42e2c0c0b3451a99b5607dd037ba70945004f98b2de74b89a2"
//
// * Step 3:
// podman pull --authfile /root/ocp4-disconnected/pull-secret.json registry.redhat.io/container-native-virtualization/virtio-win@sha256:<digest>
export const WINTOOLS_CONTAINER_DIGEST =
  '011060472f068e42e2c0c0b3451a99b5607dd037ba70945004f98b2de74b89a2';
export const WINTOOLS_CONTAINER_NAME_DOWNSTREAM = `registry.redhat.io/container-native-virtualization/virtio-win@sha256:${WINTOOLS_CONTAINER_DIGEST}`;

export const WINTOOLS_CONTAINER_NAMES = {
  openshift: WINTOOLS_CONTAINER_NAME_DOWNSTREAM,
  ocp: WINTOOLS_CONTAINER_NAME_DOWNSTREAM,
  online: WINTOOLS_CONTAINER_NAME_DOWNSTREAM,
  dedicated: WINTOOLS_CONTAINER_NAME_DOWNSTREAM,
  azure: WINTOOLS_CONTAINER_NAME_DOWNSTREAM,
  okd: 'kubevirt/virtio-container-disk', // comunity version is always "latest"
};

export const PENDING_RESTART_LABEL = '(pending restart)';
export const getPVCUploadURL = (pvcNamespace: string): string =>
  `/k8s/ns/${pvcNamespace}/persistentvolumeclaims/~new/upload-form`;

export const ROOT_DISK_NAME = 'rootdisk';
export const ROOT_DISK_INSTALL_NAME = 'install';

export const TEMPLATE_PIN = 'kubevirt.templates.pins';
export const TEMPLATE_PIN_PROMOTED = 'kubevirt.templates.pins.promoted';
export const TEMPLATE_WARN_SUPPORT = 'kubevirt.templates.warnSupport';
export const TEMPLATE_CUSTOMIZE_SOURCE = 'kubevirt.templates.customizeSource';

export const DEFAULT_DISK_SIZE = '20Gi';
