import { ConfigMapKind, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { V1alpha1DataVolume, V1Disk, V1PersistentVolumeClaim, V1Volume } from '../../types/api';
import { UINetworkEditConfig, UINetworkInterfaceValidation } from '../../types/ui/nic';
import { UIStorageEditConfig, UIStorageValidation } from '../../types/ui/storage';
import { VMWizardInitialData } from '../../types/url';
import { V1Network, V1NetworkInterface } from '../../types/vm';
import { IDReferences } from '../../utils/redux/id-reference';

export enum VMWizardTab {
  IMPORT_PROVIDERS = 'IMPORT_PROVIDERS',
  VM_SETTINGS = 'VM_SETTINGS',
  NETWORKING = 'NETWORKING',
  STORAGE = 'STORAGE',
  ADVANCED = 'ADVANCED',
  REVIEW = 'REVIEW',
  RESULT = 'RESULT',
}

export enum VMWizardProps {
  isSimpleView = 'isSimpleView',
  isCreateTemplate = 'isCreateTemplate',
  isProviderImport = 'isProviderImport',
  isTemplateInitialized = 'isTemplateInitialized',
  userTemplates = 'userTemplates',
  dataVolumes = 'dataVolumes',
  userTemplate = 'userTemplate',
  activeNamespace = 'activeNamespace',
  openshiftFlag = 'openshiftFlag',
  reduxID = 'reduxID',
  virtualMachines = 'virtualMachines',
  commonTemplates = 'commonTemplates',
  commonTemplateName = 'commonTemplateName',
  openshiftCNVBaseImages = 'openshiftCNVBaseImages',
  storageClassConfigMap = 'storageClassConfigMap',
  nads = 'nads',
  initialData = 'initialData',
}

// order important
export const ALL_VM_WIZARD_TABS = [
  VMWizardTab.IMPORT_PROVIDERS,
  VMWizardTab.VM_SETTINGS,
  VMWizardTab.NETWORKING,
  VMWizardTab.STORAGE,
  VMWizardTab.ADVANCED,
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
  OPERATING_SYSTEM = 'OPERATING_SYSTEM',
  CLONE_COMMON_BASE_DISK_IMAGE = 'CLONE_COMMON_BASE_DISK_IMAGE',
  CLONE_COMMON_BASE_DISK_IMAGE_TEMPLATE = 'CLONE_COMMON_BASE_DISK_IMAGE_TEMPLATE',
  MOUNT_WINDOWS_GUEST_TOOLS = 'MOUNT_WINDOWS_GUEST_TOOLS',
  FLAVOR = 'FLAVOR',
  MEMORY = 'MEMORY',
  CPU = 'CPU',
  WORKLOAD_PROFILE = 'WORKLOAD_PROFILE',
  PROVISION_SOURCE_TYPE = 'PROVISION_SOURCE_TYPE',
  CONTAINER_IMAGE = 'CONTAINER_IMAGE',
  IMAGE_URL = 'IMAGE_URL',
  START_VM = 'START_VM',
  TEMPLATE_PROVIDER = 'TEMPLATE_PROVIDER',
  TEMPLATE_SUPPORTED = 'TEMPLATE_SUPPORTED',
  CLONE_PVC_NS = 'CLONE_PVC_NS',
  CLONE_PVC_NAME = 'CLONE_PVC_NAME',
  DEFAULT_STORAGE_CLASS = 'DEFAULT_STORAGE_CLASS',
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
  networkAttachmentDefinitions = 'ovirtNads',
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
  AUTH_KEYS = 'AUTH_KEYS',
}

export type VMSettingsFieldAttribute =
  | VMSettingsField.HOSTNAME
  | VMSettingsField.DEFAULT_STORAGE_CLASS;

export type VMSettingsRenderableField = Exclude<
  VMSettingsField,
  VMSettingsField.HOSTNAME | VMSettingsField.DEFAULT_STORAGE_CLASS
>;

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
  errorKey?: string;
  fieldKeys?: string[];
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
  | VMWizardProps.userTemplate
  | VMWizardProps.userTemplates
  | VMWizardProps.commonTemplates
  | VMWizardProps.openshiftCNVBaseImages
  | VMWizardProps.dataVolumes
  | VMWizardProps.storageClassConfigMap
  | VMWizardProps.nads
  | VMWareProviderProps.deployment
  | VMWareProviderProps.deploymentPods
  | VMWareProviderProps.v2vvmware
  | VMWareProviderProps.vmwareToKubevirtOsConfigMap
  | VMWareProviderProps.vCenterSecrets
  | OvirtProviderProps.deployment
  | OvirtProviderProps.deploymentPods
  | OvirtProviderProps.ovirtEngineSecrets
  | OvirtProviderProps.ovirtProvider
  | OvirtProviderProps.networkAttachmentDefinitions;

export type CommonDataProp =
  | VMWizardProps.isSimpleView
  | VMWizardProps.isCreateTemplate
  | VMWizardProps.isProviderImport
  | VMWizardProps.isTemplateInitialized
  | VMWizardProps.dataVolumes
  | VMWizardProps.initialData
  | ChangedCommonDataProp;

export type ChangedCommonData = Set<ChangedCommonDataProp>;

export const DetectCommonDataChanges = new Set<ChangedCommonDataProp>([
  VMWizardProps.activeNamespace,
  VMWizardProps.openshiftFlag,
  VMWizardProps.userTemplate,
  VMWizardProps.userTemplates,
  VMWizardProps.virtualMachines,
  VMWizardProps.commonTemplates,
  VMWizardProps.storageClassConfigMap,
  VMWizardProps.openshiftCNVBaseImages,
  VMWizardProps.dataVolumes,
  VMWizardProps.nads,
  VMWareProviderProps.deployment,
  VMWareProviderProps.deploymentPods,
  VMWareProviderProps.v2vvmware,
  VMWareProviderProps.vmwareToKubevirtOsConfigMap,
  VMWareProviderProps.vCenterSecrets,
  OvirtProviderProps.deployment,
  OvirtProviderProps.deploymentPods,
  OvirtProviderProps.ovirtEngineSecrets,
  OvirtProviderProps.ovirtProvider,
  OvirtProviderProps.networkAttachmentDefinitions,
]);

export const DirectCommonDataProps = new Set<ChangedCommonDataProp>([
  VMWizardProps.storageClassConfigMap,
  VMWizardProps.openshiftCNVBaseImages,
  VMWizardProps.dataVolumes,
]);

export type CommonData = {
  data?: {
    isSimpleView?: boolean;
    isCreateTemplate?: boolean;
    isProviderImport?: boolean;
    isTemplateInitialized?: boolean;
    storageClassConfigMap?: {
      loaded: boolean;
      loadError: string;
      data: ConfigMapKind;
    };
    [VMWizardProps.openshiftCNVBaseImages]?: {
      loaded: boolean;
      loadError: string;
      data: PersistentVolumeClaimKind[];
    };
    [VMWizardProps.dataVolumes]?: {};
    initialData: VMWizardInitialData;
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
};
