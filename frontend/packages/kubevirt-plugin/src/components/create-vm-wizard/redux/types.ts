import { ValidationObject } from '@console/shared';
import {
  ChangedCommonData,
  ChangedCommonDataProp,
  CloudInitField,
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
  VMSettingsFieldType,
  VMWareProviderField,
  VMWizardNetwork,
  VMWizardStorage,
  VMWizardTab,
} from '../types';
import { DeviceType } from '../../../constants/vm';
import { FirehoseResource } from '@console/internal/components/utils';

export enum ActionType {
  Create = 'KubevirtVMWizardExternalCreate',
  Dispose = 'KubevirtVMWiExternalDispose',
  CreateVM = 'KubevirtVMWiExternalCreateVM',
  UpdateCommonData = 'KubevirtVMWizardExternalUpdateCommonData',
  SetGoToStep = 'KubevirtVMWizardExternalSetGoToStep',
  SetVmSettingsFieldValue = 'KubevirtVMWizardExternalSetVmSettingsFieldValue',
  SetImportProvidersFieldValue = 'KubevirtVMWizardExternalSetImportProvidersFieldValue',
  UpdateImportProviderField = 'KubevirtVMWizardExternalUpdateImportProviderField',
  SetCloudInitFieldValue = 'KubevirtVMWizardExternalSetCloudInitFieldValue',
  SetTabLocked = 'KubevirtVMWizardExternalSetTabLocked',
  SetTabHidden = 'KubevirtVMWizardExternalSetTabHidden',
  RemoveNIC = 'KubevirtVMWizardExternalRemoveNIC',
  UpdateNIC = 'KubevirtVMWizardExternalUpdateNIC',
  SetDeviceBootOrder = 'KubevirtVMWizardExternalSetDeviceBootOrder',
  RemoveStorage = 'KubevirtVMWizardExternalRemoveStorage',
  UpdateStorage = 'KubevirtVMWizardExternalUpdateStorage',
  SetResults = 'KubevirtVMWizardExternalSetResults',
}

// should not be called directly from outside redux code (e.g. stateUpdate)
export enum InternalActionType {
  Create = 'KubevirtVMWizardCreate',
  Dispose = 'KubevirtVMWizardDispose',
  Update = 'KubevirtVMWizardUpdate',
  UpdateCommonData = 'KubevirtVMWizardUpdateCommonData',
  SetExtraWSQueries = 'KubevirtVMWizardSetExtraWSQueries',
  SetGoToStep = 'KubevirtVMWizardSetGoToStep',
  SetTabValidity = 'KubevirtVMWizardSetTabValidity',
  SetTabLocked = 'KubevirtVMWizardSetTabLocked',
  SetTabHidden = 'KubevirtVMWizardSetTabHidden',
  SetVmSettingsFieldValue = 'KubevirtVMWizardSetVmSettingsFieldValue',
  SetImportProvidersFieldValue = 'KubevirtVMWizardSetImportProvidersFieldValue',
  UpdateImportProviderField = 'KubevirtVMWizardUpdateImportProviderField',
  UpdateImportProvider = 'KubevirtVMWizardUpdateImportProvider',
  SetCloudInitFieldValue = 'KubevirtVMWizardSetCloudInitFieldValue',
  SetInVmSettings = 'KubevirtVMWizardSetInVmSettings',
  SetInVmSettingsBatch = 'KubevirtVMWizardSetInVmSettingsBatch',
  UpdateVmSettingsField = 'KubevirtVMWizardUpdateVmSettingsField',
  UpdateVmSettings = 'KubevirtVMWizardUpdateVmSettings',
  RemoveNIC = 'KubevirtVMWizardRemoveNIC',
  UpdateNIC = 'KubevirtVMWizardUpdateNIC',
  SetDeviceBootOrder = 'KubevirtVMWizardSetDeviceBootOrder',
  RemoveStorage = 'KubevirtVMWizardRemoveStorage',
  UpdateStorage = 'KubevirtVMWizardUpdateStorage',
  SetNetworks = 'KubevirtVMWizardSetNetworks',
  SetStorages = 'KubevirtVMWizardSetStorages',
  SetResults = 'KubevirtVMWizardSetResults',
}

export type WizardInternalAction = {
  type: InternalActionType;
  payload: {
    id: string;
    value?: any;
    isValid?: boolean;
    isLocked?: boolean;
    isPending?: boolean;
    isHidden?: boolean;
    hasAllRequiredFilled?: boolean;
    path?: string[];
    key?: VMSettingsField | CloudInitField | VMWareProviderField | ImportProvidersField;
    queryKey?: string;
    wsQueries?: FirehoseResource[];
    provider?: VMImportProvider;
    tab?: VMWizardTab;
    batch?: ActionBatch;
    network?: VMWizardNetwork;
    networkID?: string;
    storage?: VMWizardStorage;
    storageID?: string;
    deviceID?: string;
    deviceType?: DeviceType;
    bootOrder?: number;
    error?: string;
  };
};

export type WizardInternalActionDispatcher = (id: string, ...any) => WizardInternalAction;
export type WizardActionDispatcher = (
  id: string,
  ...any
) => (dispatch: Function, getState: Function) => void;

export type ActionBatch = { path: string[]; value: any }[];

export type UpdateOptions = {
  id: string;
  changedCommonData: ChangedCommonData;
  dispatch: Function;
  getState: Function;
  prevState: any;
};

export type VmSettingsValidator = (
  field: VMSettingsFieldType,
  options: UpdateOptions,
) => ValidationObject;

export type VMSettingsValidationConfig = {
  [key: string]: {
    detectValueChanges?: ((field, options) => VMSettingsField[]) | VMSettingsField[];
    detectCommonDataChanges?:
      | ((field, options) => ChangedCommonDataProp[])
      | ChangedCommonDataProp[];
    validator: VmSettingsValidator;
  };
};
