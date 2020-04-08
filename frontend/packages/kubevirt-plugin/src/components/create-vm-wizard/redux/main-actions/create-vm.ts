import { InternalActionType } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { EnhancedK8sMethods } from '../../../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import { immutableListToJS } from '../../../../utils/immutable';
import { VMWizardNetwork, VMWizardProps, VMWizardStorage } from '../../types';
import { createVM as _createVM, createVMTemplate } from '../../../../k8s/requests/vm/create/create';
import {
  cleanupAndGetResults,
  getResults,
} from '../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { ResultsWrapper } from '../../../../k8s/enhancedK8sMethods/types';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { iGetNetworks } from '../../selectors/immutable/networks';
import { iGetStorages } from '../../selectors/immutable/storage';
import { iGetImportProviders } from '../../selectors/immutable/import-providers';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { ImportProvidersSettings, VMSettings } from '../initial-state/types';

export const createVMAction = (id: string) => (dispatch, getState) => {
  dispatch(
    vmWizardInternalActions[InternalActionType.SetResults](
      id,
      { errors: [], requestResults: [] },
      null,
      true,
      true,
    ),
  );

  const state = getState();

  const enhancedK8sMethods = new EnhancedK8sMethods();

  const importProviders = iGetImportProviders(state, id).toJS() as ImportProvidersSettings;
  const vmSettings = iGetVmSettings(state, id).toJS() as VMSettings;
  const networks = immutableListToJS<VMWizardNetwork>(iGetNetworks(state, id));
  const storages = immutableListToJS<VMWizardStorage>(iGetStorages(state, id));

  const namespace = iGetCommonData<string>(state, id, VMWizardProps.activeNamespace);
  const isCreateTemplate = iGetCommonData<boolean>(state, id, VMWizardProps.isCreateTemplate);
  const isProviderImport = iGetCommonData<boolean>(state, id, VMWizardProps.isProviderImport);
  const openshiftFlag = iGetCommonData<boolean>(state, id, VMWizardProps.openshiftFlag);

  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  const params = {
    enhancedK8sMethods,
    importProviders,
    vmSettings,
    networks,
    storages,
    iUserTemplates,
    iCommonTemplates,
    namespace,
    openshiftFlag,
    isTemplate: isCreateTemplate,
    isProviderImport,
  };

  const create = isCreateTemplate ? createVMTemplate : _createVM;
  create(params)
    .then(() => getResults(enhancedK8sMethods))
    .catch((error) => cleanupAndGetResults(enhancedK8sMethods, error))
    .then(({ isValid, ...tabState }: ResultsWrapper) =>
      dispatch(
        vmWizardInternalActions[InternalActionType.SetResults](id, tabState, isValid, false, false),
      ),
    )
    .catch((e) => console.error(e)); // eslint-disable-line no-console
};
