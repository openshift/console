import { VMWizardProps, VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { checkTabValidityChanged, iGetCommonData } from '../../selectors/immutable/selectors';
import { iGetImportProviders } from '../../selectors/immutable/import-providers';
import { getFieldsValidity } from './utils';
import { getProviders } from '../../provider-definitions';

export const setImportProvidersTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const isProviderImport = iGetCommonData(state, id, VMWizardProps.isProviderImport);
  let result = { error: null, hasAllRequiredFilled: true, isValid: true };
  if (isProviderImport) {
    const importProviders = iGetImportProviders(state, id);
    result = getFieldsValidity(importProviders);
    if (result.isValid) {
      for (const provider of getProviders()) {
        const v = provider.getImportProvidersTabValidity(options);
        if (v && !v.isValid) {
          result = v;
          break;
        }
      }
    }
  }

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.IMPORT_PROVIDERS,
      result.isValid,
      result.hasAllRequiredFilled,
      result.error,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.IMPORT_PROVIDERS,
        result.isValid,
        result.hasAllRequiredFilled,
        result.error,
      ),
    );
  }
};
