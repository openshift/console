import { FirehoseResult } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { getStringEnumValues } from '../../utils/types';
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

export enum VMWizardTab { // order important
  VM_SETTINGS = 'VM_SETTINGS',
  NETWORKING = 'NETWORKING',
  ADVANCED_CLOUD_INIT = 'ADVANCED_CLOUD_INIT',
  ADVANCED_VIRTUAL_HARDWARE = 'ADVANCED_VIRTUAL_HARDWARE',
  STORAGE = 'STORAGE',
  REVIEW = 'REVIEW',
  RESULT = 'RESULT',
}

export enum VMWizardProps {
  isCreateTemplate = 'isCreateTemplate',
  isProviderImport = 'isProviderImport',
  activeNamespace = 'activeNamespace',
  openshiftFlag = 'openshiftFlag',
  reduxID = 'reduxID',
  virtualMachines = 'virtualMachines',
  userTemplates = 'userTemplates',
  commonTemplates = 'commonTemplates',
  dataVolumes = 'dataVolumes',
}

export const ALL_VM_WIZARD_TABS = getStringEnumValues<VMWizardTab>(VMWizardTab);

export enum VMSettingsField { // TODO refactor to NAME = 'NAME' format for easier debugging once kubevirt-web-ui-components is deprecated
  NAME = 'name',
  HOSTNAME = 'hostname',
  DESCRIPTION = 'description',
  PROVISION_SOURCE_TYPE = 'provisionSourceType',
  CONTAINER_IMAGE = 'containerImage',
  IMAGE_URL = 'imageURL',
  PROVIDER = 'provider',
  PROVIDERS_DATA = 'providersData',
  USER_TEMPLATE = 'userTemplate',
  OPERATING_SYSTEM = 'operatingSystem',
  FLAVOR = 'flavor',
  MEMORY = 'memory',
  CPU = 'cpu',
  WORKLOAD_PROFILE = 'workloadProfile',
  START_VM = 'startVM',
}

export enum VMImportProvider { // TODO refactor to VMWARE = 'VMWARE' once kubevirt-web-ui-components is deprecated
  VMWARE = 'VMware',
}

export enum VMWareProviderProps {
  vCenterSecrets = 'vCenterSecrets',
  vmwareToKubevirtOsConfigMap = 'vmwareToKubevirtOsConfigMap',
  deploymentPods = 'deploymentPods',
  deployment = 'deployment',
  v2vvmware = 'v2vvmware',
  activeVcenterSecret = 'activeVcenterSecret',
}

export enum VMWareProviderField { // TODO refactor to VCENTER_KEY = 'VCENTER_KEY' once kubevirt-web-ui-components is deprecated
  VCENTER = 'vCenterInstance',
  HOSTNAME = 'vmwareHostname',
  USER_NAME = 'vmwareUserName',
  USER_PASSWORD_AND_CHECK_CONNECTION = 'vmwarePassword',
  REMEMBER_PASSWORD = 'rememberVMwareCredentials',

  CHECK_CONNECTION = 'checkConnectionButton',
  STATUS = 'vmwareStatus',

  VM = 'vmwareVm',

  V2V_NAME = 'v2vVmwareName',
  V2V_LAST_ERROR = 'PROVIDER_VMWARE_V2V_LAST_ERROR',
  NEW_VCENTER_NAME = 'newVCenterName',
}

export enum CloudInitField {
  IS_FORM = 'IS_FORM',
}

export type VMSettingsRenderableField = Exclude<VMSettingsField, VMSettingsField.PROVIDERS_DATA>;
export type VMWareProviderRenderableField =
  | VMWareProviderField.VCENTER
  | VMWareProviderField.HOSTNAME
  | VMWareProviderField.USER_NAME
  | VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION
  | VMWareProviderField.REMEMBER_PASSWORD
  | VMWareProviderField.STATUS
  | VMWareProviderField.VM;
export type VMSettingsRenderableFieldResolver = {
  [key in VMSettingsRenderableField | VMWareProviderRenderableField]: string;
};

export type VMSettingsFieldType = {
  value: any;
  key: VMSettingsField;
  isRequired?: boolean;
  isHidden?: boolean;
  isDisabled?: boolean;
  [k: string]: any;
};

export type ChangedCommonDataProp =
  | VMWizardProps.activeNamespace
  | VMWizardProps.virtualMachines
  | VMWizardProps.userTemplates
  | VMWizardProps.commonTemplates
  | VMWizardProps.dataVolumes
  | VMWizardProps.openshiftFlag
  | VMWareProviderProps.deployment
  | VMWareProviderProps.deploymentPods
  | VMWareProviderProps.v2vvmware
  | VMWareProviderProps.vmwareToKubevirtOsConfigMap
  | VMWareProviderProps.activeVcenterSecret
  | VMWareProviderProps.vCenterSecrets;

export type CommonDataProp =
  | VMWizardProps.isCreateTemplate
  | VMWizardProps.isProviderImport
  | ChangedCommonDataProp;

export type ChangedCommonData = Set<ChangedCommonDataProp>;

export const DetectCommonDataChanges = new Set<ChangedCommonDataProp>([
  VMWizardProps.activeNamespace,
  VMWizardProps.openshiftFlag,
  VMWizardProps.virtualMachines,
  VMWizardProps.userTemplates,
  VMWizardProps.commonTemplates,
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
    isCreateTemplate?: boolean;
    isProviderImport?: boolean;
  };
  dataIDReferences?: IDReferences;
};

export type CreateVMWizardComponentProps = {
  isProviderImport: boolean;
  isCreateTemplate: boolean;
  dataIDReferences: IDReferences;
  activeNamespace: string;
  openshiftFlag: boolean;
  reduxID: string;
  stepData: any;
  userTemplates: FirehoseResult<TemplateKind[]>;
  commonTemplates: FirehoseResult<TemplateKind[]>;
  virtualMachines: FirehoseResult<VMKind[]>;
  onInitialize: () => void;
  onClose: (disposeOnly: boolean) => void;
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
    fileName?: string;
  };
};

export type VMWizardStorageWithWrappers = VMWizardStorage & {
  diskWrapper?: DiskWrapper;
  volumeWrapper?: VolumeWrapper;
  dataVolumeWrapper?: DataVolumeWrapper;
  persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;
};
