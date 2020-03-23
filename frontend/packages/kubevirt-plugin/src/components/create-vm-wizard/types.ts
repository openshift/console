import { FirehoseResult } from '@console/internal/components/utils';
import { ConfigMapKind, TemplateKind } from '@console/internal/module/k8s';
import { V1Network, V1NetworkInterface, VMKind } from '../../types/vm';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { UINetworkInterfaceValidation } from '../../utils/validations/vm/nic';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { V1Volume } from '../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { IDReferences } from '../../utils/redux/id-reference';
import { V1PersistentVolumeClaim } from '../../types/vm/disk/V1PersistentVolumeClaim';
import { PersistentVolumeClaimWrapper } from '../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { UIDiskValidation } from '../../utils/validations/vm/types';

export enum VMWizardTab {
  IMPORT_PROVIDERS = 'IMPORT_PROVIDERS',
  VM_SETTINGS = 'VM_SETTINGS',
  NETWORKING = 'NETWORKING',
  STORAGE = 'STORAGE',
  ADVANCED_CLOUD_INIT = 'ADVANCED_CLOUD_INIT',
  ADVANCED_VIRTUAL_HARDWARE = 'ADVANCED_VIRTUAL_HARDWARE',
  REVIEW = 'REVIEW',
  RESULT = 'RESULT',
}

export enum VMWizardProps {
  isSimpleView = 'isSimpleView',
  isCreateTemplate = 'isCreateTemplate',
  isProviderImport = 'isProviderImport',
  userTemplateName = 'userTemplateName',
  activeNamespace = 'activeNamespace',
  openshiftFlag = 'openshiftFlag',
  reduxID = 'reduxID',
  virtualMachines = 'virtualMachines',
  userTemplates = 'userTemplates',
  commonTemplates = 'commonTemplates',
  dataVolumes = 'dataVolumes',
  storageClassConfigMap = 'storageClassConfigMap',
}

// order important
export const ALL_VM_WIZARD_TABS = [
  VMWizardTab.IMPORT_PROVIDERS,
  VMWizardTab.VM_SETTINGS,
  VMWizardTab.NETWORKING,
  VMWizardTab.STORAGE,
  VMWizardTab.ADVANCED_CLOUD_INIT,
  VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
  VMWizardTab.REVIEW,
  VMWizardTab.RESULT,
];

export const VM_WIZARD_SIMPLE_TABS = [
  VMWizardTab.IMPORT_PROVIDERS,
  VMWizardTab.REVIEW,
  VMWizardTab.RESULT,
];

export const VM_WIZARD_DIFFICULT_TABS = ALL_VM_WIZARD_TABS.filter(
  (tab) => !VM_WIZARD_SIMPLE_TABS.includes(tab),
);

export enum VMSettingsField {
  NAME = 'NAME',
  HOSTNAME = 'HOSTNAME',
  DESCRIPTION = 'DESCRIPTION',
  PROVISION_SOURCE_TYPE = 'PROVISION_SOURCE_TYPE',
  CONTAINER_IMAGE = 'CONTAINER_IMAGE',
  IMAGE_URL = 'IMAGE_URL',
  USER_TEMPLATE = 'USER_TEMPLATE',
  OPERATING_SYSTEM = 'OPERATING_SYSTEM',
  FLAVOR = 'FLAVOR',
  MEMORY = 'MEMORY',
  CPU = 'CPU',
  WORKLOAD_PROFILE = 'WORKLOAD_PROFILE',
  START_VM = 'START_VM',
}

export enum ImportProvidersField {
  PROVIDER = 'PROVIDER',
  PROVIDERS_DATA = 'PROVIDERS_DATA',
}

export enum VMImportProvider {
  VMWARE = 'VMWARE',
}

export enum VMWareProviderProps {
  vCenterSecrets = 'vCenterSecrets',
  vmwareToKubevirtOsConfigMap = 'vmwareToKubevirtOsConfigMap',
  deploymentPods = 'deploymentPods',
  deployment = 'deployment',
  v2vvmware = 'v2vvmware',
  activeVcenterSecret = 'activeVcenterSecret',
}

export enum VMWareProviderField {
  VCENTER = 'VCENTER',
  HOSTNAME = 'HOSTNAME',
  USER_NAME = 'USER_NAME',
  USER_PASSWORD_AND_CHECK_CONNECTION = 'USER_PASSWORD_AND_CHECK_CONNECTION',
  REMEMBER_PASSWORD = 'REMEMBER_PASSWORD',

  CHECK_CONNECTION = 'CHECK_CONNECTION',
  STATUS = 'STATUS',

  VM = 'VM',

  V2V_NAME = 'V2V_NAME',
  V2V_LAST_ERROR = 'V2V_LAST_ERROR',
  NEW_VCENTER_NAME = 'NEW_VCENTER_NAME',
}

export enum CloudInitField {
  IS_FORM = 'IS_FORM',
}

export type VMSettingsRenderableField = VMSettingsField;
export type ImportProviderRenderableField = Exclude<
  ImportProvidersField,
  ImportProvidersField.PROVIDERS_DATA
>;

export type VMWareProviderRenderableField =
  | VMWareProviderField.VCENTER
  | VMWareProviderField.HOSTNAME
  | VMWareProviderField.USER_NAME
  | VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION
  | VMWareProviderField.REMEMBER_PASSWORD
  | VMWareProviderField.STATUS
  | VMWareProviderField.VM;

export type RenderableField =
  | VMSettingsField
  | ImportProviderRenderableField
  | VMWareProviderRenderableField;

export type RenderableFieldResolver = {
  [key in RenderableField]: string;
};

export type VMWizardTabMetadata = {
  isValid?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
  isPending?: boolean;
  hasAllRequiredFilled?: boolean;
  error?: string;
};

export type VMWizardTabsMetadata = {
  [k in VMWizardTab]: VMWizardTabMetadata;
};

export type VMWizardTabState = VMWizardTabMetadata & {
  value: any;
};

export type VMSettingsFieldType = {
  value: any;
  key: VMSettingsField;
  isRequired?: any;
  isHidden?: any;
  isDisabled?: any;
  [k: string]: any;
};

export type ChangedCommonDataProp =
  | VMWizardProps.activeNamespace
  | VMWizardProps.virtualMachines
  | VMWizardProps.userTemplates
  | VMWizardProps.commonTemplates
  | VMWizardProps.dataVolumes
  | VMWizardProps.storageClassConfigMap
  | VMWizardProps.openshiftFlag
  | VMWareProviderProps.deployment
  | VMWareProviderProps.deploymentPods
  | VMWareProviderProps.v2vvmware
  | VMWareProviderProps.vmwareToKubevirtOsConfigMap
  | VMWareProviderProps.activeVcenterSecret
  | VMWareProviderProps.vCenterSecrets;

export type CommonDataProp =
  | VMWizardProps.isSimpleView
  | VMWizardProps.isCreateTemplate
  | VMWizardProps.isProviderImport
  | VMWizardProps.userTemplateName
  | ChangedCommonDataProp;

export type ChangedCommonData = Set<ChangedCommonDataProp>;

export const DetectCommonDataChanges = new Set<ChangedCommonDataProp>([
  VMWizardProps.activeNamespace,
  VMWizardProps.openshiftFlag,
  VMWizardProps.virtualMachines,
  VMWizardProps.userTemplates,
  VMWizardProps.commonTemplates,
  VMWizardProps.storageClassConfigMap,
  VMWizardProps.dataVolumes,
  VMWareProviderProps.deployment,
  VMWareProviderProps.deploymentPods,
  VMWareProviderProps.v2vvmware,
  VMWareProviderProps.vmwareToKubevirtOsConfigMap,
  VMWareProviderProps.activeVcenterSecret,
  VMWareProviderProps.vCenterSecrets,
]);

export type CommonData = {
  data?: {
    isSimpleView?: boolean;
    isCreateTemplate?: boolean;
    isProviderImport?: boolean;
    userTemplateName?: string;
    storageClassConfigMap?: {
      loaded: boolean;
      loadError: string;
      data: ConfigMapKind;
    };
  };
  dataIDReferences?: IDReferences;
};

export type CreateVMWizardComponentProps = {
  isSimpleView: boolean;
  isProviderImport: boolean;
  isCreateTemplate: boolean;
  isLastTabErrorFatal: boolean;
  dataIDReferences: IDReferences;
  activeNamespace: string;
  openshiftFlag: boolean;
  reduxID: string;
  tabsMetadata: VMWizardTabsMetadata;
  userTemplates: FirehoseResult<TemplateKind[]>;
  commonTemplates: FirehoseResult<TemplateKind[]>;
  virtualMachines: FirehoseResult<VMKind[]>;
  storageClassConfigMap: FirehoseResult<ConfigMapKind>;
  onInitialize: () => void;
  onClose: (disposeOnly: boolean) => void;
  createVM: () => void;
  onCommonDataChanged: (commonData: CommonData, commonDataChanged: ChangedCommonData) => void;
  onResultsChanged: (results, isValid: boolean, isLocked: boolean, isPending: boolean) => void;
  lockTab: (tabID: VMWizardTab) => void;
};

export enum VMWizardNetworkType {
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
};

export type VMWizardNetworkWithWrappers = VMWizardNetwork & {
  networkInterfaceWrapper: NetworkInterfaceWrapper;
  networkWrapper: NetworkWrapper;
};

export enum VMWizardStorageType {
  TEMPLATE = 'TEMPLATE',
  PROVISION_SOURCE_TEMPLATE_DISK = 'PROVISION_SOURCE_TEMPLATE_DISK',
  PROVISION_SOURCE_DISK = 'PROVISION_SOURCE_DISK',
  UI_INPUT = 'UI_INPUT',
  V2V_VMWARE_IMPORT = 'V2V_VMWARE_IMPORT',
  V2V_VMWARE_IMPORT_TEMP = 'V2V_VMWARE_IMPORT_TEMP',
  WINDOWS_GUEST_TOOLS = 'WINDOWS_GUEST_TOOLS',
  WINDOWS_GUEST_TOOLS_TEMPLATE = 'WINDOWS_GUEST_TOOLS_TEMPLATE',
}

export type VMWizardStorage = {
  id?: string;
  type: VMWizardStorageType;
  disk?: V1Disk;
  volume?: V1Volume;
  dataVolume?: V1alpha1DataVolume;
  validation?: UIDiskValidation;
  persistentVolumeClaim?: V1PersistentVolumeClaim;
  importData?: {
    mountPath?: string;
    devicePath?: string;
    fileName?: string;
  };
};

export type VMWizardStorageWithWrappers = VMWizardStorage & {
  diskWrapper?: DiskWrapper;
  volumeWrapper?: VolumeWrapper;
  dataVolumeWrapper?: DataVolumeWrapper;
  persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;
};
