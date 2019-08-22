import { FirehoseResult } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { getStringEnumValues } from '../../utils/types';
import { VMKind } from '../../types/vm';

export enum VMWizardTab { // order important
  VM_SETTINGS = 'VM_SETTINGS',
  NETWORKS = 'NETWORKS',
  STORAGE = 'STORAGE',
  REVIEW = 'REVIEW',
  RESULT = 'RESULT',
}

export enum VMWizardProps {
  isCreateTemplate = 'isCreateTemplate',
  activeNamespace = 'activeNamespace',
  reduxID = 'reduxID',
  virtualMachines = 'virtualMachines',
  userTemplates = 'userTemplates',
  commonTemplates = 'commonTemplates',
  networkConfigs = 'networkConfigs',
  storageClasses = 'storageClasses',
  persistentVolumeClaims = 'persistentVolumeClaims',
  dataVolumes = 'dataVolumes',
}

export const ALL_VM_WIZARD_TABS = getStringEnumValues<VMWizardTab>(VMWizardTab);

export enum VMSettingsField { // TODO refactor to NAME = 'NAME' format for easier debugging once kubevirt-web-ui-components is deprecated
  NAME = 'name',
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
  USE_CLOUD_INIT = 'cloudInit',
  USE_CLOUD_INIT_CUSTOM_SCRIPT = 'useCloudInitCustomScript',
  HOST_NAME = 'hostname',
  AUTHKEYS = 'authKeys',
  CLOUD_INIT_CUSTOM_SCRIPT = 'cloudInitCustomScript',
}

export type VMSettingsRenderableField = Exclude<VMSettingsField, VMSettingsField.PROVIDERS_DATA>;
export type VMSettingsRenderableFieldResolver = { [key in VMSettingsRenderableField]: string };

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
  | VMWizardProps.dataVolumes
  | VMWizardProps.userTemplates
  | VMWizardProps.persistentVolumeClaims
  | VMWizardProps.commonTemplates
  | VMWizardProps.networkConfigs
  | VMWizardProps.storageClasses;

export type CommonDataProp = VMWizardProps.isCreateTemplate | ChangedCommonDataProp;

export type ChangedCommonData = Set<ChangedCommonDataProp>;

export const DetectCommonDataChanges = new Set<ChangedCommonDataProp>([
  VMWizardProps.activeNamespace,
  VMWizardProps.virtualMachines,
  VMWizardProps.dataVolumes,
  VMWizardProps.userTemplates,
  VMWizardProps.commonTemplates,
  VMWizardProps.persistentVolumeClaims,
  VMWizardProps.networkConfigs,
]);

export type CommonData = {
  data?: {
    isCreateTemplate?: boolean;
  };
  dataIDReferences?: { [k in ChangedCommonDataProp]: string[] };
};

export type CreateVMWizardComponentProps = {
  isCreateTemplate: boolean;
  dataIDReferences: { [k in ChangedCommonDataProp]: string[] };
  activeNamespace: string;
  reduxID: string;
  stepData: any;
  userTemplates: FirehoseResult<TemplateKind[]>;
  commonTemplates: FirehoseResult<TemplateKind[]>;
  virtualMachines: FirehoseResult<VMKind[]>;
  onInitialize: () => void;
  onClose: () => void;
  onCommonDataChanged: (commonData: CommonData, commonDataChanged: ChangedCommonData) => void;
  onResultsChanged: (results, valid) => void;
};
