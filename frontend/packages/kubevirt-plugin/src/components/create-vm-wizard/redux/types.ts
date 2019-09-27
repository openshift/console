import {
  ChangedCommonData,
  ChangedCommonDataProp,
  VMSettingsField,
  VMSettingsFieldType,
  VMWizardTab,
} from '../types';
import { ValidationObject } from '../../../utils/validations/types';

export enum ActionType {
  Create = 'KubevirtVMWizardCreate',
  Dispose = 'KubevirtVMWizardDispose',
  UpdateCommonData = 'KubevirtVMWizardUpdateCommonData',
  SetVmSettingsFieldValue = 'KubevirtVMWizardSetVmSettingsFieldValue',
  SetTabLocked = 'KubevirtVMWizardSetTabLocked',
  SetNetworks = 'KubevirtVMWizardSetNetworks',
  SetStorages = 'KubevirtVMWizardSetStorages',
  SetResults = 'KubevirtVMWizardSetResults',
}

// should not be called directly from outside redux code (e.g. stateUpdate)
export enum InternalActionType {
  Create = 'KubevirtVMWizardCreate',
  Dispose = 'KubevirtVMWizardDispose',
  Update = 'KubevirtVMWizardUpdateInternal',
  UpdateCommonData = 'KubevirtVMWizardUpdateCommonData',
  SetTabValidity = 'KubevirtVMWizardSetTabValidityInternal',
  SetTabLocked = 'KubevirtVMWizardSetTabLocked',
  SetVmSettingsFieldValue = 'KubevirtVMWizardSetVmSettingsFieldValueInternal',
  SetInVmSettings = 'KubevirtVMWizardSetInVmSettingsInternal',
  SetInVmSettingsBatch = 'KubevirtVMWizardSetInVmSettingsBatchInternal',
  UpdateVmSettingsField = 'KubevirtVMWizardUpdateVmSettingsFieldInternal',
  UpdateVmSettings = 'KubevirtVMWizardUpdateVmSettingsInternal',
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
    hasAllRequiredFilled?: boolean;
    path?: string[];
    key?: VMSettingsField;
    tab?: VMWizardTab;
    batch?: ActionBatch;
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
