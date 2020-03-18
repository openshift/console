import {
  CommonData,
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
  VMWareProviderField,
} from '../../types';

export type StepState = {
  value: any;
  error: string;
  isValid: boolean;
  isLocked: boolean;
  isHidden: boolean;
  hasAllRequiredFilled: boolean;
};

export type InitialStepStateGetter = (data: CommonData) => StepState;

export type FieldMultiFlag = { [k: string]: boolean };

export type SettingsField = {
  key?: VMSettingsField | ImportProvidersField | VMWareProviderField;
  value?: any;
  isHidden?: FieldMultiFlag;
  isRequired?: FieldMultiFlag;
  skipValidation?: boolean;
  binaryUnitValidation?: boolean;
};

export type VMwareSettings = { [key in VMWareProviderField]: SettingsField } & {
  [VMWareProviderField.V2V_NAME]: string;
  [VMWareProviderField.NEW_VCENTER_NAME]: string;
};

export type VMSettings = { [key in VMSettingsField]: SettingsField };

type ImportProviderOption = { name: string; id: VMImportProvider };

export type ImportProvidersSettings = {
  [ImportProvidersField.PROVIDER]: SettingsField & {
    providers: ImportProviderOption[];
  };
  [ImportProvidersField.PROVIDERS_DATA]: {
    [VMImportProvider.VMWARE]?: VMwareSettings;
  };
};
