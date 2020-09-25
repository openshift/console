import * as _ from 'lodash';
import { asValidationObject, ValidationErrorType } from '@console/shared';
import { UpdateOptions, InternalActionType, ValidationConfig } from '../../types';
import {
  iGetVMwareData,
  isVMWareProvider,
  hasVMWareSettingsChanged,
  iGetVMWareField,
} from '../../../selectors/immutable/provider/vmware/selectors';
import { VMWareProviderField, VMImportProvider } from '../../../types';
import { getValidationUpdate } from '../utils';
import { vmWizardInternalActions } from '../../internal-actions';
import { iGetFieldValue } from '../../../selectors/immutable/field';
import { iGet, iGetIn } from '../../../../../utils/immutable';
import { VMwareFirmware } from '../../../../../constants/v2v-import/vmware/vmware-firmware';

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
  [VMWareProviderField.VM]: {
    detectValueChanges: [VMWareProviderField.VM],
    validator: (field) => {
      const vm = iGet(field, 'vm');

      if (vm) {
        const raw = vm.getIn(['detail', 'raw']);

        const parsedVM = JSON.parse(raw);
        const firmware = VMwareFirmware.fromString(parsedVM?.Config?.Firmware);

        if (!firmware?.isSupported()) {
          return asValidationObject(`VM has unsupported firmware: ${firmware}`);
        }
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

  const vmField = iGetVMWareField(state, id, VMWareProviderField.VM);
  const hasSelectedVM = !!iGet(vmField, 'value');
  const hasLoadedVM = !!iGet(vmField, 'vm');
  const hasValidVM = iGetIn(vmField, ['validation', 'type']) !== ValidationErrorType.Error;

  let error = null;

  if (!hasSelectedVM) {
    error = 'Please select a VM to import.';
  } else if (!hasLoadedVM) {
    error = 'Please wait for a VM to load.';
  } else if (!hasValidVM) {
    error = 'Please select a valid VM.';
  }

  return {
    hasAllRequiredFilled: hasSelectedVM,
    isValid: hasLoadedVM && hasValidVM,
    error,
  };
};
