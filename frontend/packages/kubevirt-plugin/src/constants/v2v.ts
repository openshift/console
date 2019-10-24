export const CONVERSION_POD_TEMP_MOUNT_PATH = '/var/tmp';

export const V2VVMWARE_DEPLOYMENT_NAME = 'v2v-vmware';

export const VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE = 'kube-public'; // note: common-templates are in the "openshift" namespace
// TODO: make it configurable via VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP
export const VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME = 'vmware-to-kubevirt-os'; // single configMap per cluster, contains mapping of vmware guestId to common-templates OS ID

export const VCENTER_TYPE_LABEL = 'kubevirt.io/vcenter';
export const VCENTER_TEMPORARY_LABEL = 'kubevirt.io/temporary';
