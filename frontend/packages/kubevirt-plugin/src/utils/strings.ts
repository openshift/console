export const COULD_NOT_LOAD_DATA = 'Could not load data';

export const CREATED = 'created';
export const CREATED_WITH_FAILED_CLEANUP = 'created & failed to clean up';
export const CREATED_WITH_CLEANUP = 'created & cleaned up';
export const FAILED_TO_CREATE = 'failed to create';
export const FAILED_TO_PATCH = 'failed to patch';
export const DYNAMIC = 'Dynamic';

export const READY = 'Ready';

export const CLOUD = 'cloud';
export const SSH = 'ssh';
export const SYSPREP = 'sysprep';
export const HARDWARE = 'hardware';

export const RHEL8 = 'rhel8';
export const RHEL7 = 'rhel7';
export const CENTOS7 = 'centos7';
export const CENTOS8 = 'centos8';
export const CENTOS_STREAM8 = 'centos-stream8';
export const CENTOS_STREAM9 = 'centos-stream9';
export const WIN2k = 'win2k';
export const WIN10 = 'win10';
export const NO_LABEL = 'NO_LABEL';

export const RHEL8_EXAMPLE_CONTAINER = 'registry.redhat.io/rhel8/rhel-guest-image:latest';
export const RHEL7_EXAMPLE_CONTAINER = 'registry.redhat.io/rhel7/rhel-guest-image:latest';
export const FEDORA_EXAMPLE_CONTAINER = 'quay.io/containerdisks/fedora:latest';
export const CENTOS7_EXAMPLE_CONTAINER = 'quay.io/containerdisks/centos:7-2009';
export const CENTOS8_EXAMPLE_CONTAINER = 'quay.io/containerdisks/centos:8.4';
export const CENTOS_STREAM8_EXAMPLE_CONTAINER = 'quay.io/containerdisks/centos-stream:8';
export const CENTOS_STREAM9_EXAMPLE_CONTAINER = 'quay.io/containerdisks/centos-stream:9';
export const CENTOS_IMAGE_LINK = 'https://cloud.centos.org/centos/';
export const FEDORA_IMAGE_LINK = 'https://alt.fedoraproject.org/cloud/';
export const RHEL_IMAGE_LINK = 'https://access.redhat.com/downloads/content/479/ver=/rhel---8/';
export const CLOUD_INIT_MISSING_USERNAME =
  'No username set, see operating system documentation for the default username.';
export const CLOUD_INIT_DOC_LINK = 'https://cloudinit.readthedocs.io/en/latest/index.html';
export const STORAGE_CLASS_SUPPORTED_MATRIX_DOC_LINK =
  'https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/virtualization/virtual-machines#virt-features-for-storage';
export const STORAGE_CLASS_SUPPORTED_RHV_LINK =
  'https://docs.openshift.com/container-platform/4.8/virt/virtual_machines/importing_vms/virt-importing-rhv-vm.html';
export const STORAGE_CLASS_SUPPORTED_VMWARE_LINK =
  'https://docs.openshift.com/container-platform/4.8/virt/virtual_machines/importing_vms/virt-importing-vmware-vm.html';
export const NODE_PORTS_LINK =
  'https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/networking/configuring-ingress-cluster-traffic#nw-using-nodeport_configuring-ingress-cluster-traffic-nodeport';

export const PREALLOCATION_DATA_VOLUME_LINK =
  'https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/virtualization/virtual-machines#virt-using-preallocation-for-datavolumes';

export const WINDOWS_IMAGE_LINKS = {
  win10: 'https://www.microsoft.com/en-us/software-download/windows10ISO',
  win2k16: 'https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2016?filetype=ISO',
  win2k12r2:
    'https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2012-r2?filetype=ISO',
  win2k19: 'https://www.microsoft.com/en-US/evalcenter/evaluate-windows-server-2019?filetype=ISO',
};
