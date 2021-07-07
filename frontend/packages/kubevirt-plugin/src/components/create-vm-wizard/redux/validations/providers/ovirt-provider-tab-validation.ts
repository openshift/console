import * as _ from 'lodash';
import { asValidationObject, ValidationErrorType } from '../../../../../selectors';
import { iGetFieldValue } from '../../../selectors/immutable/field';
import {
  hasOvirtSettingsChanged,
  iGetOvirtData,
  iGetOvirtFieldAttribute,
  iGetOvirtFieldValue,
  isOvirtProvider,
} from '../../../selectors/immutable/provider/ovirt/selectors';
import { OvirtProviderField, VMImportProvider } from '../../../types';
import { vmWizardInternalActions } from '../../internal-actions';
import { InternalActionType, UpdateOptions, Validation, ValidationConfig } from '../../types';
import { getValidationUpdate } from '../utils';

const validationConfig: ValidationConfig<OvirtProviderField> = {
  [OvirtProviderField.API_URL]: {
    detectValueChanges: [OvirtProviderField.API_URL],
    validator: (field) => {
      const apiURL = iGetFieldValue(field);
      const invalidEnding = apiURL && !apiURL.endsWith('/ovirt-engine/api');
      const invalidStart = apiURL && !apiURL.startsWith('https://');

      if (invalidStart && invalidEnding) {
        return asValidationObject(
          // t(`kubevirt-plugin~URL has to start with "https://" and end with "/ovirt-engine/api"`)
          `kubevirt-plugin~URL has to start with "https://" and end with "/ovirt-engine/api"`,
          ValidationErrorType.Error,
        );
      }

      if (invalidEnding) {
        return asValidationObject(
          // t(`kubevirt-plugin~URL has to end with "/ovirt-engine/api"`)
          `kubevirt-plugin~URL has to end with "/ovirt-engine/api"`,
          ValidationErrorType.Error,
        );
      }

      if (invalidStart) {
        // t(`kubevirt-plugin~URL has to start with "https://"`)
        return asValidationObject(
          `kubevirt-plugin~URL has to start with "https://"`,
          ValidationErrorType.Error,
        );
      }

      return null;
    },
  },
  [OvirtProviderField.USERNAME]: {
    detectValueChanges: [OvirtProviderField.USERNAME],
    validator: (field) => {
      const username = iGetFieldValue(field);

      if (username && (!username.includes('@') || username.endsWith('@'))) {
        // t(`kubevirt-plugin~Username should end with "@profile"`)
        return asValidationObject(
          `kubevirt-plugin~Username should end with "@profile"`,
          ValidationErrorType.Info,
        );
      }

      return null;
    },
  },
  [OvirtProviderField.CERTIFICATE]: {
    detectValueChanges: [OvirtProviderField.CERTIFICATE],
    validator: (field) => {
      const certificate = iGetFieldValue(field);

      const invalidHeader = certificate && !certificate?.startsWith('-----BEGIN CERTIFICATE-----');
      const invalidFooter = certificate && !certificate?.endsWith('-----END CERTIFICATE-----');

      if (invalidHeader && invalidFooter) {
        return asValidationObject(
          // t(`kubevirt-plugin~Invalid CA PEM format. First line has to be "-----BEGIN CERTIFICATE-----" \n\n and last line has to be "-----END CERTIFICATE-----"`)
          `kubevirt-plugin~Invalid CA PEM format. First line has to be "-----BEGIN CERTIFICATE-----" \n\n and last line has to be "-----END CERTIFICATE-----"`,
          ValidationErrorType.Error,
        );
      }

      if (invalidFooter) {
        return asValidationObject(
          // t(`kubevirt-plugin~Invalid CA PEM format. Last line has to be "-----END CERTIFICATE-----"`)
          `kubevirt-plugin~Invalid CA PEM format. Last line has to be "-----END CERTIFICATE-----"`,
          ValidationErrorType.Error,
        );
      }

      if (invalidHeader) {
        return asValidationObject(
          // t(`kubevirt-plugin~Invalid CA PEM format. First line has to be "-----BEGIN CERTIFICATE-----"`)
          `kubevirt-plugin~Invalid CA PEM format. First line has to be "-----BEGIN CERTIFICATE-----"`,
          ValidationErrorType.Error,
        );
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

export const getOvirtProviderProvidersTabValidity = (options: UpdateOptions): Validation => {
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
    // t('kubevirt-plugin~Please wait for a VM to load.')
    // t('kubevirt-plugin~Please select a VM to import.')
    errorKey: hasLoadedVM
      ? null
      : hasSelectedVM
      ? 'kubevirt-plugin~Please wait for a VM to load.'
      : 'kubevirt-plugin~Please select a VM to import.',
  };
};
