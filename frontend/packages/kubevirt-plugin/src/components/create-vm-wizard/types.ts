import { ConfigMapKind } from '@console/internal/module/k8s';
import { V1Network, V1NetworkInterface } from '../../types/vm';
import { IDReferences } from '../../utils/redux/id-reference';
import { UINetworkEditConfig, UINetworkInterfaceValidation } from '../../types/ui/nic';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { V1Volume } from '../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { V1PersistentVolumeClaim } from '../../types/vm/disk/V1PersistentVolumeClaim';
import { UIStorageEditConfig, UIStorageValidation } from '../../types/ui/storage';

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
  openshiftCNVBaseImages = 'openshiftCNVBaseImages',
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
  USER_TEMPLATE = 'USER_TEMPLATE',
  OPERATING_SYSTEM = 'OPERATING_SYSTEM',
  CLONE_COMMON_BASE_DISK_IMAGE = 'CLONE_COMMON_BASE_DISK_IMAGE',
  FLAVOR = 'FLAVOR',
  MEMORY = 'MEMORY',
  CPU = 'CPU',
  WORKLOAD_PROFILE = 'WORKLOAD_PROFILE',
  PROVISION_SOURCE_TYPE = 'PROVISION_SOURCE_TYPE',
  CONTAINER_IMAGE = 'CONTAINER_IMAGE',
  IMAGE_URL = 'IMAGE_URL',
  START_VM = 'START_VM',
}

export enum ImportProvidersField {
  PROVIDER = 'PROVIDER',
  PROVIDERS_DATA = 'PROVIDERS_DATA',
}

export enum VMImportProvider {
  VMWARE = 'VMWARE',
  OVIRT = 'OVIRT',
}

export enum VMWareProviderProps {
  vCenterSecrets = 'vCenterSecrets',
  vmwareToKubevirtOsConfigMap = 'vmwareToKubevirtOsConfigMap',
  deploymentPods = 'vmwareDeploymentPods',
  deployment = 'vmwareDeployment',
  v2vvmware = 'v2vvmware',
}

export enum OvirtProviderProps {
  ovirtEngineSecrets = 'ovirtEngineSecrets',
  deploymentPods = 'ovirtDeploymentPods',
  deployment = 'ovirtDeployment',
  ovirtProvider = 'ovirtProvider',
}

export enum VMWareProviderField {
  VCENTER_SECRET_NAME = 'vmware_VCENTER',
  HOSTNAME = 'vmware_HOSTNAME',
  USERNAME = 'vmware_USER_NAME',
  PASSWORD = 'vmware_USER_PASSWORD_AND_CHECK_CONNECTION',
  REMEMBER_PASSWORD = 'vmware_REMEMBER_PASSWORD',

  VM = 'vmware_VM',

  STATUS = 'vmware_STATUS',

  CONTROLLER_LAST_ERROR = 'vmware_CONTROLLER_LAST_ERROR',

  CURRENT_V2V_VMWARE_CR_NAME = 'vmware_CURRENT_V2V_VMWARE_CR_NAME',
  CURRENT_RESOLVED_VCENTER_SECRET_NAME = 'vmware_CURRENT_RESOLVED_VCENTER_SECRET_NAME',
}

export enum OvirtProviderField {
  OVIRT_ENGINE_SECRET_NAME = 'ovirt_OVIRT_ENGINE_SECRET_NAME',
  API_URL = 'ovirt_API_URL',
  CERTIFICATE = 'ovirt_CERTIFICATE',
  USERNAME = 'ovirt_USERNAME',
  PASSWORD = 'ovirt_PASSWORD',
  REMEMBER_PASSWORD = 'ovirt_REMEMBER_PASSWORD',

  VM = 'ovirt_VM',
  CLUSTER = 'ovirt_CLUSTER',

  STATUS = 'ovirt_STATUS',

  CONTROLLER_LAST_ERROR = 'ovirt_CONTROLLER_LAST_ERROR',

  CURRENT_OVIRT_PROVIDER_CR_NAME = 'ovirt_CURRENT_OVIRT_PROVIDER_CR_NAME',
  CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME = 'ovirt_CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME',
}

export enum CloudInitField {
  IS_FORM = 'IS_FORM',
}

export type VMSettingsRenderableField = Exclude<VMSettingsField, VMSettingsField.HOSTNAME>;

export type ImportProviderRenderableField = Exclude<
  ImportProvidersField,
  ImportProvidersField.PROVIDERS_DATA
>;

export type VMWareProviderRenderableField =
  | VMWareProviderField.VCENTER_SECRET_NAME
  | VMWareProviderField.HOSTNAME
  | VMWareProviderField.USERNAME
  | VMWareProviderField.PASSWORD
  | VMWareProviderField.REMEMBER_PASSWORD
  | VMWareProviderField.STATUS
  | VMWareProviderField.VM;

export type OvirtProviderRenderableField =
  | OvirtProviderField.OVIRT_ENGINE_SECRET_NAME
  | OvirtProviderField.API_URL
  | OvirtProviderField.CERTIFICATE
  | OvirtProviderField.USERNAME
  | OvirtProviderField.PASSWORD
  | OvirtProviderField.REMEMBER_PASSWORD
  | OvirtProviderField.STATUS
  | OvirtProviderField.CLUSTER
  | OvirtProviderField.VM;

export type RenderableField =
  | VMSettingsRenderableField
  | ImportProviderRenderableField
  | VMWareProviderRenderableField
  | OvirtProviderRenderableField;

export type RenderableFieldResolver = {
  [key in RenderableField]: string;
};

export type VMWizardTabMetadata = {
  isValid?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
  isPending?: boolean;
  canJumpTo?: boolean;
  hasAllRequiredFilled?: boolean;
  error?: string;
  isCreateDisabled?: boolean;
  isUpdateDisabled?: boolean;
  isDeleteDisabled?: boolean;
};

export type VMWizardTabsMetadata = {
  [k in VMWizardTab]: VMWizardTabMetadata;
};

export type VMWizardTabState = VMWizardTabMetadata & {
  value: any;
};

export type SettingsFieldType<Field = VMSettingsField> = {
  value: any;
  key: Field;
  isRequired?: any;
  isHidden?: any;
  isDisabled?: any;
  [k: string]: any;
};

export type ChangedCommonDataProp =
  | VMWizardProps.activeNamespace
  | VMWizardProps.openshiftFlag
  | VMWizardProps.virtualMachines
  | VMWizardProps.userTemplates
  | VMWizardProps.commonTemplates
  | VMWizardProps.dataVolumes
  | VMWizardProps.openshiftCNVBaseImages
  | VMWizardProps.storageClassConfigMap
  | VMWareProviderProps.deployment
  | VMWareProviderProps.deploymentPods
  | VMWareProviderProps.v2vvmware
  | VMWareProviderProps.vmwareToKubevirtOsConfigMap
  | VMWareProviderProps.vCenterSecrets
  | OvirtProviderProps.deployment
  | OvirtProviderProps.deploymentPods
  | OvirtProviderProps.ovirtEngineSecrets
  | OvirtProviderProps.ovirtProvider;

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
  VMWizardProps.openshiftCNVBaseImages,
  VMWareProviderProps.deployment,
  VMWareProviderProps.deploymentPods,
  VMWareProviderProps.v2vvmware,
  VMWareProviderProps.vmwareToKubevirtOsConfigMap,
  VMWareProviderProps.vCenterSecrets,
  OvirtProviderProps.deployment,
  OvirtProviderProps.deploymentPods,
  OvirtProviderProps.ovirtEngineSecrets,
  OvirtProviderProps.ovirtProvider,
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
  PROVISION_SOURCE_TEMPLATE_DISK = 'PROVISION_SOURCE_TEMPLATE_DISK',
  PROVISION_SOURCE_DISK = 'PROVISION_SOURCE_DISK',
  UI_INPUT = 'UI_INPUT',
  V2V_VMWARE_IMPORT = 'V2V_VMWARE_IMPORT',
  V2V_VMWARE_IMPORT_TEMP = 'V2V_VMWARE_IMPORT_TEMP',
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
};
