import * as _ from 'lodash';
import { UINetworkEditConfig } from '../../types/ui/nic';
import { UIStorageEditConfig } from '../../types/ui/storage';

export const isFieldEditable = (
  editConfig: UINetworkEditConfig | UIStorageEditConfig,
  fieldName: string,
) => {
  if (editConfig) {
    return _.has(editConfig.isFieldEditableOverride, [fieldName])
      ? !!editConfig.isFieldEditableOverride[fieldName]
      : !editConfig.disableEditing;
  }

  return true;
};

export const isFieldDisabled = (
  editConfig: UINetworkEditConfig | UIStorageEditConfig,
  fieldName: string,
) => !isFieldEditable(editConfig, fieldName);
