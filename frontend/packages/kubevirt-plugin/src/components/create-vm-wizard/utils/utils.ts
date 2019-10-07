import { safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { VMSettingsField } from '../types';
import { ResultContentType } from '../../../k8s/enhancedK8sMethods/types';

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

export const resultContentToString = (data, type: ResultContentType) => {
  switch (type) {
    case ResultContentType.YAML:
      return safeDump(data);
    case ResultContentType.JSON:
      return JSON.stringify(data, null, 1);
    case ResultContentType.Other:
    default:
      return _.toString(data);
  }
};
