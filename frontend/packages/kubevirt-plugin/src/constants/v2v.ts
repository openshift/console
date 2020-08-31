export const CONVERSION_POD_TEMP_MOUNT_PATH = '/var/tmp';

export const V2VVMWARE_DEPLOYMENT_NAME = 'v2v-vmware';

export const CONVERSION_BASE_NAME = 'kubevirt-v2v-conversion';
export const CONVERSION_GENERATE_NAME = `${CONVERSION_BASE_NAME}-`;

export const VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME = 'v2v-vmware';
// Different releases, different locations. Respect the order when resolving. Otherwise the configMap name/namespace is considered as well-known.
export const VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES = [
  'openshift-cnv',
  'kubevirt-hyperconverged',
];

export const VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE = 'kube-public'; // note: common-templates are in the "openshift" namespace
// TODO: make it configurable via VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP
export const VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME = 'vmware-to-kubevirt-os'; // single configMap per cluster, contains mapping of vmware guestId to common-templates OS ID

export const CONVERSION_SERVICEACCOUNT_DELAY = 2 * 1000; // in ms

export const VCENTER_TYPE_LABEL = 'kubevirt.io/vcenter';
export const OVIRT_TYPE_LABEL = 'kubevirt.io/ovirt';
export const V2V_TEMPORARY_LABEL = 'kubevirt.io/temporary';

export const CONVERSION_VDDK_INIT_POD_NAME = 'vddk-init';
export const CONVERSION_VOLUME_VDDK_NAME = 'volume-vddk';
export const CONVERSION_VDDK_MOUNT_PATH = '/opt/vmware-vix-disklib-distrib';

export const CONVERSION_PROGRESS_ANNOTATION = 'v2vConversionProgress';

export const V2V_DATA_TTL_KEY = 'timeToLive';

export enum V2VConfigMapAttribute {
  kubevirtVmwareImage = 'kubevirt-vmware-image', // the kubevirt-vmware provider is responsible for reading VMs list/details from the VMware API
  kubevirtVmwareImagePullPolicy = 'kubevirt-vmware-image-pull-policy',
  v2vConversionImage = 'v2v-conversion-image', // full image name of kubevirt-v2v-conversion
  vddkInitImage = 'vddk-init-image',
}

export const VMWARE_DOCURL =
  'https://docs.openshift.com/container-platform/4.5/virt/virtual_machines/importing_vms/virt-importing-vmware-vm.html';
export const OVIRT_DOCURL =
  'https://docs.openshift.com/container-platform/4.5/virt/virtual_machines/importing_vms/virt-importing-rhv-vm.html';

export enum V2VProviderErrorSpecialUIMessageRequest {
  supplyDoclink = '__supplyDoclink__',
}
