import { VMSettingsField } from '../types';

export const VM_SETTINGS_METADATA_ID = 'VM_SETTINGS_METADATA_ID';
export const VMWARE_PROVIDER_METADATA_ID = 'VMWARE_PROVIDER_METADATA_ID';

export const asRequired = (value: any, key: string = VM_SETTINGS_METADATA_ID) => ({
  [key]: !!value,
});
export const asHidden = (value: any, key: string = VM_SETTINGS_METADATA_ID) => ({ [key]: !!value });
export const asDisabled = (value: any, key: string = VM_SETTINGS_METADATA_ID) => ({
  [key]: !!value,
});

export const nullOnEmptyChange = (
  onChange: (k: VMSettingsField, v: string) => void,
  fieldKey: VMSettingsField,
) => (v) => onChange(fieldKey, v === '' ? null : v);
