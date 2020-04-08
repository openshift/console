import { CommonData, ImportProvidersField } from '../../types';
import { asHidden, asRequired, IMPORT_PROVIDES_METADATA_ID } from '../../utils/utils';
import { getProviders } from '../../provider-definitions';
import { InitialStepStateGetter, ImportProvidersSettings } from './types';

export const getInitialImportProviders = (data: CommonData): ImportProvidersSettings => {
  const {
    data: { isProviderImport },
  } = data;

  return {
    [ImportProvidersField.PROVIDER]: {
      key: ImportProvidersField.PROVIDER,
      isRequired: asRequired(isProviderImport, IMPORT_PROVIDES_METADATA_ID),
      isHidden: asHidden(!isProviderImport, IMPORT_PROVIDES_METADATA_ID),
      providers: getProviders().map((provider) => ({ name: provider.name, id: provider.id })),
    },
    [ImportProvidersField.PROVIDERS_DATA]: {
      ...getProviders().reduce((allProviders, provider) => {
        allProviders[provider.id] = provider.getInitialState();
        return allProviders;
      }, {}),
    },
  };
};

export const getImportProvidersInitialState: InitialStepStateGetter = (data) => {
  const { isProviderImport } = data.data;
  return {
    value: isProviderImport ? getInitialImportProviders(data) : {},
    error: null,
    hasAllRequiredFilled: !isProviderImport,
    isValid: !isProviderImport,
    isLocked: false,
    isHidden: !isProviderImport,
  };
};
