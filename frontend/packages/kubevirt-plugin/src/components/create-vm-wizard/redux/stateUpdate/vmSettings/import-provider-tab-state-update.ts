import { VMWizardProps } from '../../../types';
import { UpdateOptions } from '../../types';
import { iGetCommonData } from '../../../selectors/immutable/selectors';
import { getProviders } from '../../../provider-definitions';

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
