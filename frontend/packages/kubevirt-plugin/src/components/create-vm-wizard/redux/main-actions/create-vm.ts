import { EnhancedK8sMethods } from '../../../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import {
  cleanupAndGetResults,
  getResults,
} from '../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { ResultsWrapper } from '../../../../k8s/enhancedK8sMethods/types';
import { createVM as _createVM, createVMTemplate } from '../../../../k8s/requests/vm/create/create';
import {
  SourceRefActions,
  SourceRefActionsNames,
} from '../../../../redux/actions/sourceRef-actions';
import { SysprepActions, SysprepActionsNames } from '../../../../redux/actions/sysprep-actions';
import { immutableListToJS } from '../../../../utils/immutable';
import { createOrDeleteSSHService } from '../../../ssh-service/SSHForm/ssh-form-utils';
import { iGetImportProviders } from '../../selectors/immutable/import-providers';
import { iGetNetworks } from '../../selectors/immutable/networks';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { iGetStorages } from '../../selectors/immutable/storage';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import {
  getEnableSSHService,
  getSysprepData,
  getSourceRefData,
} from '../../selectors/immutable/wizard-selectors';
import { iGetHardwareField } from '../../tabs/advanced-tab/hardware-devices/selectors';
import {
  AUTOUNATTEND,
  createSysprepConfigMap,
  UNATTEND,
} from '../../tabs/advanced-tab/sysprep/utils/sysprep-utils';
import { HardwareDevicesField, VMWizardNetwork, VMWizardProps, VMWizardStorage } from '../../types';
import { ImportProvidersSettings, VMSettings } from '../initial-state/types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType } from '../types';

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

  const enableSSHService = getEnableSSHService(state);
  const sysprepData = getSysprepData(state);
  const sourceRef = getSourceRefData(state);
  const enhancedK8sMethods = new EnhancedK8sMethods();

  const importProviders = iGetImportProviders(state, id).toJS() as ImportProvidersSettings;
  const vmSettings = iGetVmSettings(state, id).toJS() as VMSettings;
  const networks = immutableListToJS<VMWizardNetwork>(iGetNetworks(state, id));
  const storages = immutableListToJS<VMWizardStorage>(iGetStorages(state, id));

  const namespace = iGetCommonData<string>(state, id, VMWizardProps.activeNamespace);
  const isCreateTemplate = iGetCommonData<boolean>(state, id, VMWizardProps.isCreateTemplate);
  const isProviderImport = iGetCommonData<boolean>(state, id, VMWizardProps.isProviderImport);
  const openshiftFlag = iGetCommonData<boolean>(state, id, VMWizardProps.openshiftFlag);

  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  const gpus = iGetHardwareField(state, id, HardwareDevicesField.GPUS)?.toJS();
  const hostDevices = iGetHardwareField(state, id, HardwareDevicesField.HOST_DEVICES)?.toJS();

  const params = {
    enhancedK8sMethods,
    importProviders,
    vmSettings,
    networks,
    storages,
    iUserTemplate,
    iCommonTemplates,
    namespace,
    openshiftFlag,
    isTemplate: isCreateTemplate,
    isProviderImport,
    sysprepData,
    gpus,
    hostDevices,
    sourceRef,
  };

  const create = isCreateTemplate ? createVMTemplate : _createVM;
  create(params)
    .then(() => getResults(enhancedK8sMethods))
    .catch((error) =>
      cleanupAndGetResults(enhancedK8sMethods, error, { prettyPrintPermissionErrors: false }),
    )
    .then(({ isValid, ...tabState }: ResultsWrapper) => {
      const vm = tabState.requestResults[0]?.content?.data;
      if (vm && enableSSHService) {
        createOrDeleteSSHService(vm, enableSSHService);
      }
      if (sysprepData?.[AUTOUNATTEND] || sysprepData?.[UNATTEND]) {
        createSysprepConfigMap(vm, sysprepData);
        dispatch(SysprepActions[SysprepActionsNames.clearValues]());
      }
      if (sourceRef) {
        dispatch(SourceRefActions[SourceRefActionsNames.clearValues]());
      }
      dispatch(
        vmWizardInternalActions[InternalActionType.SetResults](id, tabState, isValid, false, false),
      );
    })
    .catch((e) =>
      // eslint-disable-next-line no-console
      console.error(`Error while create a ${isCreateTemplate ? 'VM template' : 'VM'}`, e),
    );
};
