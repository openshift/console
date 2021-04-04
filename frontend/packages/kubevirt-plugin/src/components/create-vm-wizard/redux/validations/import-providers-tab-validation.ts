import { getProviders } from '../../provider-definitions';
import { iGetImportProviders } from '../../selectors/immutable/import-providers';
import { checkTabValidityChanged, iGetCommonData } from '../../selectors/immutable/selectors';
import { VMWizardProps, VMWizardTab } from '../../types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions, Validation } from '../types';
import { getFieldsValidity } from './utils';

export const validateImportProviderTab = (options: UpdateOptions) => {
  for (const provider of getProviders()) {
    if (provider.validate) {
      provider.validate(options);
    }
  }
};

export const setImportProvidersTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const isProviderImport = iGetCommonData(state, id, VMWizardProps.isProviderImport);
  let result: Validation = { errorKey: null, hasAllRequiredFilled: true, isValid: true };
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
      result.errorKey,
      result.fieldKeys,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.IMPORT_PROVIDERS,
        result.isValid,
        result.hasAllRequiredFilled,
        result.errorKey,
      ),
    );
  }
};
