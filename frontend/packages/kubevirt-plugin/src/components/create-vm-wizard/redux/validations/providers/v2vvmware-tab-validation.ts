import * as _ from 'lodash';
import { asValidationObject } from '@console/shared';
import { UpdateOptions, InternalActionType, ValidationConfig } from '../../types';
import {
  iGetVMwareData,
  iGetVMWareFieldAttribute,
  iGetVMWareFieldValue,
  isVMWareProvider,
  hasVMWareSettingsChanged,
} from '../../../selectors/immutable/provider/vmware/selectors';
import { VMWareProviderField, VMImportProvider } from '../../../types';
import { getValidationUpdate } from '../utils';
import { vmWizardInternalActions } from '../../internal-actions';
import { iGetFieldValue } from '../../../selectors/immutable/field';

const validationConfig: ValidationConfig<VMWareProviderField> = {
  [VMWareProviderField.HOSTNAME]: {
    detectValueChanges: [VMWareProviderField.HOSTNAME],
    validator: (field) => {
      const hostname = iGetFieldValue(field);

      if (hostname && /\s/.test(hostname)) {
        return asValidationObject('Hostname must not contain white spaces');
      }
      return null;
    },
  },
};

export const validateVMwareSettings = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  if (!isVMWareProvider(state, id)) {
    return;
  }

  const vmWareSettings = iGetVMwareData(state, id);

  const update = getValidationUpdate(
    validationConfig,
    options,
    vmWareSettings,
    hasVMWareSettingsChanged,
  );

  if (!_.isEmpty(update)) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateImportProvider](
        id,
        VMImportProvider.VMWARE,
        update,
      ),
    );
  }
};

export const getV2VVMwareImportProvidersTabValidity = (
  options: UpdateOptions,
): { hasAllRequiredFilled: boolean; isValid: boolean; error: string } => {
  const { id, getState } = options;
  const state = getState();

  if (!isVMWareProvider(state, id)) {
    return null;
  }

  const hasSelectedVM = !!iGetVMWareFieldValue(state, id, VMWareProviderField.VM);
  const hasLoadedVM = !!iGetVMWareFieldAttribute(state, id, VMWareProviderField.VM, 'vm');

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
