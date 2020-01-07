import { CommonData, VMImportProvider, VMSettingsField, VMWareProviderField } from '../../types';

export type StepState = {
  value: any;
  error: string;
  isValid: boolean;
  isLocked: boolean;
  hasAllRequiredFilled: boolean;
};

export type InitialStepStateGetter = (data: CommonData) => StepState;

export type FieldMultiFlag = { [k: string]: boolean };

export type SettingsField = {
  key?: VMSettingsField | VMWareProviderField;
  value?: any;
  isHidden?: FieldMultiFlag;
  isRequired?: FieldMultiFlag;
  skipValidation?: boolean;
};

export type VMwareSettings = { [key in VMWareProviderField]: SettingsField } & {
  [VMWareProviderField.V2V_NAME]: string;
  [VMWareProviderField.NEW_VCENTER_NAME]: string;
};

export type VMSettings = { [key in VMSettingsField]: SettingsField } & {
  [VMSettingsField.PROVIDERS_DATA]: {
    [VMImportProvider.VMWARE]?: VMwareSettings;
  };
};
