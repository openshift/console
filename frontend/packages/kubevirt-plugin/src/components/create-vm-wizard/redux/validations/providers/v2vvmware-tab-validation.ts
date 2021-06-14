import * as _ from 'lodash';
import { asValidationObject, ValidationErrorType } from '@console/shared';
import { VMwareFirmware } from '../../../../../constants/v2v-import/vmware/vmware-firmware';
import { iGet, iGetIn } from '../../../../../utils/immutable';
import { iGetFieldValue } from '../../../selectors/immutable/field';
import {
  hasVMWareSettingsChanged,
  iGetVMwareData,
  iGetVMWareField,
  isVMWareProvider,
} from '../../../selectors/immutable/provider/vmware/selectors';
import { VMImportProvider, VMWareProviderField } from '../../../types';
import { vmWizardInternalActions } from '../../internal-actions';
import { InternalActionType, UpdateOptions, Validation, ValidationConfig } from '../../types';
import { getValidationUpdate } from '../utils';

const validationConfig: ValidationConfig<VMWareProviderField> = {
  [VMWareProviderField.HOSTNAME]: {
    detectValueChanges: [VMWareProviderField.HOSTNAME],
    validator: (field) => {
      const hostname = iGetFieldValue(field);

      if (hostname && /\s/.test(hostname)) {
        // t('kubevirt-plugin~Hostname must not contain white spaces')
        return asValidationObject('kubevirt-plugin~Hostname must not contain white spaces');
      }
      if (hostname?.startsWith('https://')) {
        // t('kubevirt-plugin~Hostname must not contain https prefix')
        return asValidationObject('kubevirt-plugin~Hostname must not contain https prefix');
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
          // t('kubevirt-plugin~VM has unsupported firmware: {{firmware}}')
          return asValidationObject(`kubevirt-plugin~VM has unsupported firmware: ${firmware}`);
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

export const getV2VVMwareImportProvidersTabValidity = (options: UpdateOptions): Validation => {
  const { id, getState } = options;
  const state = getState();

  if (!isVMWareProvider(state, id)) {
    return null;
  }

  const vmField = iGetVMWareField(state, id, VMWareProviderField.VM);
  const hasSelectedVM = !!iGet(vmField, 'value');
  const hasLoadedVM = !!iGet(vmField, 'vm');
  const hasValidVM = iGetIn(vmField, ['validation', 'type']) !== ValidationErrorType.Error;

  let errorKey: string;

  if (!hasSelectedVM) {
    // t('kubevirt-plugin~Please select a VM to import.')
    errorKey = 'kubevirt-plugin~Please select a VM to import.';
  } else if (!hasLoadedVM) {
    // t('kubevirt-plugin~Please wait for a VM to load.')
    errorKey = 'kubevirt-plugin~Please wait for a VM to load.';
  } else if (!hasValidVM) {
    // t('kubevirt-plugin~Please select a valid VM.')
    errorKey = 'kubevirt-plugin~Please select a valid VM.';
  }

  return {
    hasAllRequiredFilled: hasSelectedVM,
    isValid: hasLoadedVM && hasValidVM,
    errorKey,
  };
};
