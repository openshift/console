import { getProviders } from '../../provider-definitions';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { VMWizardProps } from '../../types';
import { UpdateOptions } from '../types';

export const updateImportProvidersState = (options: UpdateOptions) => {
  if (!iGetCommonData(options.getState(), options.id, VMWizardProps.isProviderImport)) {
    return;
  }
  getProviders()
    .map((provider) => provider.getStateUpdater)
    .forEach((updater) => {
      updater && updater(options);
    });
};
