import { UpdateOptions } from '../../types';
import { OvirtProviderField } from '../../../types';
import {
  iGetOvirtFieldAttribute,
  iGetOvirtFieldValue,
  isOvirtProvider,
} from '../../../selectors/immutable/provider/ovirt/selectors';

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
