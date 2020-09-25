import * as _ from 'lodash';
import { InternalActionType, UpdateOptions, ValidationConfig } from '../../types';
import { OvirtProviderField, VMImportProvider } from '../../../types';
import {
  hasOvirtSettingsChanged,
  iGetOvirtData,
  iGetOvirtFieldAttribute,
  iGetOvirtFieldValue,
  isOvirtProvider,
} from '../../../selectors/immutable/provider/ovirt/selectors';
import { getValidationUpdate } from '../utils';
import { vmWizardInternalActions } from '../../internal-actions';
import { iGetFieldValue } from '../../../selectors/immutable/field';
import { asValidationObject, ValidationErrorType } from '@console/shared/src';

const validationConfig: ValidationConfig<OvirtProviderField> = {
  [OvirtProviderField.API_URL]: {
    detectValueChanges: [OvirtProviderField.API_URL],
    validator: (field) => {
      const apiURL = iGetFieldValue(field);
      const invalidEnding = apiURL && !apiURL.endsWith('/ovirt-engine/api');
      const invalidStart = apiURL && !apiURL.startsWith('https://');

      if (invalidStart && invalidEnding) {
        return asValidationObject(
          `URL should start with "https://" and end with "/ovirt-engine/api"`,
          ValidationErrorType.Info,
        );
      }

      if (invalidEnding) {
        return asValidationObject(
          `URL should end with "/ovirt-engine/api"`,
          ValidationErrorType.Info,
        );
      }

      if (invalidStart) {
        return asValidationObject(`URL should start with "https://"`, ValidationErrorType.Info);
      }

      return null;
    },
  },
  [OvirtProviderField.USERNAME]: {
    detectValueChanges: [OvirtProviderField.USERNAME],
    validator: (field) => {
      const username = iGetFieldValue(field);

      if (username && (!username.includes('@') || username.endsWith('@'))) {
        return asValidationObject(`Username should end with "@profile"`, ValidationErrorType.Info);
      }

      return null;
    },
  },
};

export const validateOvirtSettings = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  if (!isOvirtProvider(state, id)) {
    return;
  }

  const ovirtSettings = iGetOvirtData(state, id);

  const update = getValidationUpdate(
    validationConfig,
    options,
    ovirtSettings,
    hasOvirtSettingsChanged,
  );

  if (!_.isEmpty(update)) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateImportProvider](
        id,
        VMImportProvider.OVIRT,
        update,
      ),
    );
  }
};

export const getOvirtProviderProvidersTabValidity = (
  options: UpdateOptions,
): { hasAllRequiredFilled: boolean; isValid: boolean; error: string } => {
  const { id, getState } = options;
  const state = getState();

  if (!isOvirtProvider(state, id)) {
    return null;
  }

  const hasSelectedVM = !!iGetOvirtFieldValue(state, id, OvirtProviderField.VM);
  const hasLoadedVM = !!iGetOvirtFieldAttribute(state, id, OvirtProviderField.VM, 'vm');

  return {
    hasAllRequiredFilled: hasSelectedVM,
    isValid: hasLoadedVM,
    error: hasLoadedVM
      ? null
      : hasSelectedVM
      ? 'Please wait for a VM to load.'
      : 'Please select a VM to import.',
  };
};
