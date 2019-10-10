import { FirehoseResult } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { getStringEnumValues } from '../../utils/types';
import { V1Network, V1NetworkInterface, VMKind } from '../../types/vm';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { UIDiskValidation, UINetworkInterfaceValidation } from '../../utils/validations/vm';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { V1Volume } from '../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';

export enum VMWizardTab { // order important
  VM_SETTINGS = 'VM_SETTINGS',
  NETWORKING = 'NETWORKING',
  ADVANCED_CLOUD_INIT = 'ADVANCED_CLOUD_INIT',
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
}

export enum CloudInitField {
  IS_FORM = 'IS_FORM',
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
  | VMWizardProps.userTemplates
  | VMWizardProps.commonTemplates;

export type CommonDataProp = VMWizardProps.isCreateTemplate | ChangedCommonDataProp;

export type ChangedCommonData = Set<ChangedCommonDataProp>;

export const DetectCommonDataChanges = new Set<ChangedCommonDataProp>([
  VMWizardProps.activeNamespace,
  VMWizardProps.virtualMachines,
  VMWizardProps.userTemplates,
  VMWizardProps.commonTemplates,
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
  onResultsChanged: (results, isValid: boolean, isLocked: boolean, isPending: boolean) => void;
  lockTab: (tabID: VMWizardTab) => void;
};

export enum VMWizardNetworkType {
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
}

export type VMWizardStorage = {
  id?: string;
  type: VMWizardStorageType;
  disk: V1Disk;
  volume: V1Volume;
  dataVolume?: V1alpha1DataVolume;
  validation?: UIDiskValidation;
};

export type VMWizardStorageWithWrappers = VMWizardStorage & {
  diskWrapper: DiskWrapper;
  volumeWrapper: VolumeWrapper;
  dataVolumeWrapper?: DataVolumeWrapper;
};
