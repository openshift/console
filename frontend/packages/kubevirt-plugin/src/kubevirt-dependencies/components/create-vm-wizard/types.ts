import { V1alpha1DataVolume, V1Disk, V1PersistentVolumeClaim, V1Volume } from '../../types/api';
import { UINetworkEditConfig, UINetworkInterfaceValidation } from '../../types/ui/nic';
import { UIStorageEditConfig, UIStorageValidation } from '../../types/ui/storage';
import { DataSourceKind, V1Network, V1NetworkInterface } from '../../types/vm';

export enum VMWizardNetworkType {
  V2V_OVIRT_IMPORT = 'V2V_OVIRT_IMPORT',
  V2V_VMWARE_IMPORT = 'V2V_VMWARE_IMPORT',
  TEMPLATE = 'TEMPLATE',
  UI_DEFAULT_POD_NETWORK = 'UI_DEFAULT_POD_NETWORK',
  UI_INPUT = 'UI_INPUT',
}

export type VMWizardNetwork = {
  id?: string;
  type: VMWizardNetworkType;
  network: V1Network;
  networkInterface: V1NetworkInterface;
  validation?: UINetworkInterfaceValidation;
  editConfig?: UINetworkEditConfig;
  importData?: {
    id?: string;
    vnicID?: string;
    networksWithSameVnicID?: [];
  };
};

export enum VMWizardStorageType {
  TEMPLATE = 'TEMPLATE',
  TEMPLATE_CLOUD_INIT = 'TEMPLATE_CLOUD_INIT',
  PROVISION_SOURCE_TEMPLATE_DISK = 'PROVISION_SOURCE_TEMPLATE_DISK',
  PROVISION_SOURCE_DISK = 'PROVISION_SOURCE_DISK',
  PROVISION_SOURCE_ADDITIONAL_DISK = 'PROVISION_SOURCE_ADDITIONAL_DISK',
  UI_INPUT = 'UI_INPUT',
  V2V_VMWARE_IMPORT = 'V2V_VMWARE_IMPORT',
  V2V_OVIRT_IMPORT = 'V2V_OVIRT_IMPORT',
  WINDOWS_GUEST_TOOLS = 'WINDOWS_GUEST_TOOLS',
  WINDOWS_GUEST_TOOLS_TEMPLATE = 'WINDOWS_GUEST_TOOLS_TEMPLATE',
}

export type VMWizardStorage = {
  id?: string;
  type: VMWizardStorageType;
  disk?: V1Disk;
  volume?: V1Volume;
  dataVolume?: V1alpha1DataVolume;
  validation?: UIStorageValidation;
  persistentVolumeClaim?: V1PersistentVolumeClaim;
  editConfig?: UIStorageEditConfig;
  importData?: {
    id?: string;
    mountPath?: string;
    devicePath?: string;
    fileName?: string;
  };
  sourceRef?: DataSourceKind;
};
