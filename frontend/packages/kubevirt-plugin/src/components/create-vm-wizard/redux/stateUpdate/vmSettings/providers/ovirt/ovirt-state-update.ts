import { ImportProvidersField, VMWizardProps } from '../../../../../types';
import { UpdateOptions } from '../../../../types';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { hasImportProvidersChanged } from '../../../../../selectors/immutable/import-providers';
import { updateExtraWSQueries } from './update-ws-queries';
import { isOvirtProvider } from '../../../../../selectors/immutable/provider/ovirt/selectors';
import { startVMImportOperatorWithCleanup } from './ovirt-provider-actions';

const startControllerAndCleanup = (options: UpdateOptions) => {
  const { id, prevState, getState, changedCommonData } = options;
  const state = getState();
  if (
    !(
      hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER) ||
      changedCommonData.has(VMWizardProps.activeNamespace)
    )
  ) {
    return;
  }

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);

  if (isOvirtProvider(state, id) && namespace) {
    startVMImportOperatorWithCleanup(options);
    // TODO delete stale connection objects
  }
};

export const getOvirtProviderStateUpdater = (options: UpdateOptions) =>
  [updateExtraWSQueries, startControllerAndCleanup].forEach((updater) => {
    updater && updater(options);
  });
