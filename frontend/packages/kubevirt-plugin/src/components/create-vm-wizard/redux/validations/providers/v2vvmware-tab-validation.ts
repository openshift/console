import { UpdateOptions } from '../../types';
import {
  iGetVMWareFieldAttribute,
  iGetVMWareFieldValue,
  isVMWareProvider,
} from '../../../selectors/immutable/provider/vmware/selectors';
import { VMWareProviderField } from '../../../types';

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
