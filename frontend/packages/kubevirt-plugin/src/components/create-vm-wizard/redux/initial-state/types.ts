import {
  CommonData,
  ImportProvidersField,
  OvirtProviderField,
  VMImportProvider,
  VMSettingsField,
  VMWareProviderField,
  VMWizardTabState,
} from '../../types';

export type InitialStepStateGetter = (data: CommonData) => VMWizardTabState;

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

export type OvirtSettings = { [key in OvirtProviderField]: SettingsField } & {
  [OvirtProviderField.ACTIVE_OVIRT_PROVIDER_CR_NAME]: string;
  [OvirtProviderField.NEW_OVIRT_ENGINE_SECRET_NAME]: string;
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
