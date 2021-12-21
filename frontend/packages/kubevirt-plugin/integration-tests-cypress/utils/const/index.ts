import * as urls from '../../../src/utils/strings';

export const OS_IMAGES_NS = Cypress.env('DOWNSTREAM')
  ? 'openshift-virtualization-os-images'
  : 'kubevirt-os-images';

export const IMAGE_URL = Cypress.env('DOWNSTREAM')
  ? 'http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/cnv-tests/cirros-images/cirros-0.4.0-x86_64-disk.raw.xz'
  : 'https://download.cirros-cloud.net/0.5.2/cirros-0.5.2-x86_64-disk.img';

export const KUBEVIRT_STORAGE_CLASS_DEFAULTS = 'kubevirt-storage-class-defaults';
export const KUBEVIRT_PROJECT_NAME = Cypress.env('DOWNSTREAM')
  ? 'openshift-cnv'
  : 'kubevirt-hyperconverged';
export const EXPECT_LOGIN_SCRIPT_PATH = './utils/expect-login.sh';

export const TEST_PROVIDER = 'test-provider';
export const IMPORTING = 'Importing';
export const ADD_SOURCE = 'Add source';
export const COMMUNITY = 'Community';
export const PREPARING_FOR_CUSTOMIZATION = 'Preparing for customization';
export const READY_FOR_CUSTOMIZATION = 'Ready for customization';
export const YAML_VM_NAME = 'vm-example';
export const STATUS_READY = 'Ready';
export const TEMPLATE_SUPPORT = 'Support by template provider';
export const NAD_NAME = 'bridge-network'; // refer to fixture/nad.ts

export enum DEFAULT_VALUES {
  NOT_AVAILABLE = 'Not available',
  GUEST_AGENT_REQUIRED = 'Guest agent required',
  GUEST_AGENT_UNAVAILABLE = 'Guest agent is unavailable',
  VM_NOT_RUNNING = 'Virtual machine not running',
}

// VM Actions
export enum VM_ACTION {
  Cancel = 'Cancel Virtual Machine Migration',
  Clone = 'Clone',
  Delete = 'Delete Virtual Machine',
  EditAnnotations = 'Edit Annotations',
  EditLabels = 'Edit Labels',
  Migrate = 'Migrate Node to Node',
  Restart = 'Restart',
  Start = 'Start',
  Stop = 'Stop',
  Resume = 'Resume',
  Pause = 'Pause',
}

export enum VMI_ACTION {
  Delete = 'Delete Virtual Machine Instance',
}

export enum TEMPLATE_ACTION {
  Create = 'Create Virtual Machine',
  Delete = 'Delete Template',
}

// VM Status
export enum VM_STATUS {
  Pending = 'Pending',
  Importing = 'Importing',
  Starting = 'Starting',
  Provisioning = 'Provisioning',
  Paused = 'Paused',
  Migrating = 'Migration',
  Stopping = 'Stopping',
  Running = 'Running',
  Cloning = 'Cloning',
  Stopped = 'Stopped',
}

export enum VM_ACTION_TIMEOUT {
  VM_BOOTUP = 180000,
  VM_IMPORT = 360000,
  VM_IMPORT_AND_BOOTUP = 1200000,
  VM_MIGRATE = 600000,
}

export enum Flavor {
  TINY = 'Tiny',
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  CUSTOM = 'Custom',
}

export enum DISK_INTERFACE {
  VirtIO = 'virtio',
  sata = 'sata',
  scsi = 'scsi',
}

export enum DISK_DRIVE {
  Disk = 'Disk',
  CDROM = 'CD-ROM',
}

export enum NIC_MODEL {
  virtio = 'virtio',
  e1000e = 'e1000e',
}

export enum NIC_TYPE {
  Bridge = 'Bridge',
  SR_IOV = 'SR-IOV',
}

export enum EXAMPLE_VM_NIC {
  Name = 'default',
  Model = 'virtio',
  Type = 'masquerade',
  Network = 'Pod Networking',
}

export enum K8S_KIND {
  DV = 'DataVolume',
  NAD = 'net-attach-def',
  PVC = 'PersistentVolumeClaim',
  Template = 'Template',
  VM = 'VirtualMachine',
  VMI = 'VirtualMachineInstance',
}

export const TEMPLATE = {
  RHEL6: {
    name: 'Red Hat Enterprise Linux 6.0+ VM',
    dvName: 'rhel6',
    metadataName: 'rhel6-server-small',
    os: 'Red Hat Enterprise Linux 6.0 or higher',
    supportLevel: 'Full',
    exampleImgUrl: urls.RHEL_IMAGE_LINK,
    exampleRegUrl: urls.FEDORA_EXAMPLE_CONTAINER,
  },
  RHEL7: {
    name: 'Red Hat Enterprise Linux 7.0+ VM',
    dvName: 'rhel7',
    metadataName: 'rhel7-server-small',
    os: 'Red Hat Enterprise Linux 7.0 or higher',
    supportLevel: 'Full',
    exampleImgUrl: urls.RHEL_IMAGE_LINK,
    exampleRegUrl: urls.RHEL7_EXAMPLE_CONTAINER,
  },
  RHEL8: {
    name: 'Red Hat Enterprise Linux 8.0+ VM',
    dvName: 'rhel8',
    metadataName: 'rhel8-server-small',
    os: 'Red Hat Enterprise Linux 8.0 or higher',
    supportLevel: 'Full',
    exampleImgUrl: urls.RHEL_IMAGE_LINK,
    exampleRegUrl: urls.RHEL8_EXAMPLE_CONTAINER,
  },
  RHEL9: {
    name: 'Red Hat Enterprise Linux 9.0 Alpha VM',
    dvName: 'rhel9',
    metadataName: 'rhel9-server-small',
    os: 'Red Hat Enterprise Linux 9.0 or higher',
    supportLevel: 'Limited',
    exampleImgUrl: urls.RHEL_IMAGE_LINK,
    exampleRegUrl: urls.FEDORA_EXAMPLE_CONTAINER,
  },
  FEDORA: {
    name: 'Fedora 32+ VM',
    dvName: 'fedora',
    metadataName: 'fedora-server-small',
    os: 'Fedora 32 or higher',
    supportLevel: 'Community',
    exampleImgUrl: urls.FEDORA_IMAGE_LINK,
    exampleRegUrl: urls.FEDORA_EXAMPLE_CONTAINER,
  },
  CENTOS7: {
    name: 'CentOS 7.0+ VM',
    dvName: 'centos7',
    metadataName: 'centos7-server-small',
    os: 'CentOS 7 or higher',
    supportLevel: 'Community',
    exampleImgUrl: urls.CENTOS_IMAGE_LINK,
    exampleRegUrl: urls.CENTOS7_EXAMPLE_CONTAINER,
  },
  CENTOS8: {
    name: 'CentOS 8.0+ VM',
    dvName: 'centos8',
    metadataName: 'centos8-server-small',
    os: 'CentOS 8 or higher',
    supportLevel: 'Community',
    exampleImgUrl: urls.CENTOS_IMAGE_LINK,
    exampleRegUrl: urls.CENTOS8_EXAMPLE_CONTAINER,
  },
  WIN10: {
    name: 'Microsoft Windows 10 VM',
    dvName: 'win10',
    metadataName: 'windows10-desktop-medium',
    os: 'Microsoft Windows 10',
    supportLevel: 'Full',
    exampleImgUrl: urls.WINDOWS_IMAGE_LINK,
    exampleRegUrl: '',
  },
  WIN2K12R2: {
    name: 'Microsoft Windows Server 2012 R2 VM',
    dvName: 'win2k12r2',
    metadataName: 'windows2k12r2-server-medium',
    os: 'Microsoft Windows Server 2012 R2',
    supportLevel: 'Full',
    exampleImgUrl: urls.WINDOWS_IMAGE_LINK,
    exampleRegUrl: '',
  },
  WIN2K16: {
    name: 'Microsoft Windows Server 2016 VM',
    dvName: 'win2k16',
    metadataName: 'windows2k16-server-medium',
    os: 'Microsoft Windows Server 2016',
    supportLevel: 'Full',
    exampleImgUrl: urls.WINDOWS_IMAGE_LINK,
    exampleRegUrl: '',
  },
  WIN2K19: {
    name: 'Microsoft Windows Server 2019 VM',
    dvName: 'win2k19',
    metadataName: 'windows2k19-server-medium',
    os: 'Microsoft Windows Server 2019',
    supportLevel: 'Full',
    exampleImgUrl: urls.WINDOWS_IMAGE_LINK,
    exampleRegUrl: '',
  },
  DEFAULT: {
    name: 'vm-template-example',
    dvName: 'vm-template-example',
    metadataName: 'vm-template-example',
    os: 'Red Hat Enterprise Linux 8.0 or higher',
    supportLevel: 'Full',
    exampleImgUrl: urls.RHEL_IMAGE_LINK,
    exampleRegUrl: urls.FEDORA_EXAMPLE_CONTAINER,
  },
};
