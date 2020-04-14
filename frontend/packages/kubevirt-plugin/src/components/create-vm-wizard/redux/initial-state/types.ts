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
  [VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME]: string;
  [VMWareProviderField.CURRENT_RESOLVED_VCENTER_SECRET_NAME]: string;
};

export type OvirtSettings = { [key in OvirtProviderField]: SettingsField } & {
  [OvirtProviderField.CURRENT_OVIRT_PROVIDER_CR_NAME]: string;
  [OvirtProviderField.CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME]: string;
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
