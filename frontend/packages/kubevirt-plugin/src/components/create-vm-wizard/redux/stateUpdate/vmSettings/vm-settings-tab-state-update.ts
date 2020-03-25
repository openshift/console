import { FLAGS } from '@console/shared';
import { isWinToolsImage, getVolumeContainerImage } from '../../../../../selectors/vm';
import {
  hasVmSettingsChanged,
  hasVMSettingsValueChanged,
  iGetProvisionSource,
  iGetVmSettingValue,
  iGetVmSettingAttribute,
} from '../../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../../types';
import { InternalActionType, UpdateOptions } from '../../types';
import { asDisabled, asHidden, asRequired } from '../../../utils/utils';
import { vmWizardInternalActions } from '../../internal-actions';
import {
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
} from '../../../selectors/immutable/selectors';
import { CUSTOM_FLAVOR } from '../../../../../constants/vm';
import { ProvisionSource } from '../../../../../constants/vm/provision-source';
import { getProviders } from '../../../provider-definitions';
import { windowsToolsStorage } from '../../initial-state/storage-tab-initial-state';
import { getStorages } from '../../../selectors/selectors';
import { prefillVmTemplateUpdater } from './prefill-vm-template-state-update';

export const selectUserTemplateOnLoadedUpdater = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  if (iGetVmSettingAttribute(state, id, VMSettingsField.USER_TEMPLATE, 'initialized')) {
    return;
  }

  const userTemplateName = iGetCommonData(state, id, VMWizardProps.userTemplateName);
  if (!userTemplateName) {
    return;
  }

  const userTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  if (!userTemplates) {
    return;
  }

  const isUserTemplateValid = userTemplates?.find(
    (template) => iGetName(template) === userTemplateName,
  );

  if (!isUserTemplateValid) {
    return;
  }

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.USER_TEMPLATE]: {
        initialized: true,
        value: userTemplateName,
      },
    }),
  );
};

export const selectedUserTemplateUpdater = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();
  if (!hasVmSettingsChanged(prevState, state, id, VMSettingsField.USER_TEMPLATE)) {
    return;
  }

  const userTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);

  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);

  const iUserTemplate =
    userTemplateName && userTemplates
      ? userTemplates.find((template) => iGetName(template) === userTemplateName)
      : null;

  const isDisabled = asDisabled(iUserTemplate != null, VMSettingsField.USER_TEMPLATE);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.PROVISION_SOURCE_TYPE]: { isDisabled },
      [VMSettingsField.CONTAINER_IMAGE]: { isDisabled },
      [VMSettingsField.IMAGE_URL]: { isDisabled },
      [VMSettingsField.OPERATING_SYSTEM]: { isDisabled },
      [VMSettingsField.WORKLOAD_PROFILE]: { isDisabled },
    }),
  );

  prefillVmTemplateUpdater(options);
};

export const provisioningSourceUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (
    !hasVmSettingsChanged(
      prevState,
      state,
      id,
      VMSettingsField.PROVISION_SOURCE_TYPE,
      VMSettingsField.USER_TEMPLATE,
    )
  ) {
    return;
  }
  const source = iGetProvisionSource(state, id);
  const isContainer = source === ProvisionSource.CONTAINER;
  const isUrl = source === ProvisionSource.URL;

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.CONTAINER_IMAGE]: {
        isRequired: asRequired(isContainer, VMSettingsField.PROVISION_SOURCE_TYPE),
        isHidden: asHidden(!isContainer, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
      [VMSettingsField.IMAGE_URL]: {
        isRequired: asRequired(isUrl, VMSettingsField.PROVISION_SOURCE_TYPE),
        isHidden: asHidden(!isUrl, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
    }),
  );
};

export const flavorUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (!hasVmSettingsChanged(prevState, state, id, VMSettingsField.FLAVOR)) {
    return;
  }
  const flavor = iGetVmSettingValue(state, id, VMSettingsField.FLAVOR);

  const isHidden = asHidden(flavor !== CUSTOM_FLAVOR, VMSettingsField.FLAVOR);
  const isRequired = asRequired(flavor === CUSTOM_FLAVOR, VMSettingsField.FLAVOR);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.MEMORY]: {
        isHidden,
        isRequired,
      },
      [VMSettingsField.CPU]: {
        isHidden,
        isRequired,
      },
    }),
  );
};

export const osUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (!hasVMSettingsValueChanged(prevState, state, id, VMSettingsField.OPERATING_SYSTEM)) {
    return;
  }
  const os = iGetVmSettingValue(state, id, VMSettingsField.OPERATING_SYSTEM);
  const isWindows = os && os.startsWith('win');
  const windowsTools = getStorages(state, id).find(
    (storage) => !!isWinToolsImage(getVolumeContainerImage(storage.volume)),
  );

  if (isWindows && !windowsTools) {
    dispatch(vmWizardInternalActions[InternalActionType.UpdateStorage](id, windowsToolsStorage));
  }
  if (!isWindows && windowsTools) {
    dispatch(vmWizardInternalActions[InternalActionType.RemoveStorage](id, windowsTools.id));
  }
};

export const nativeK8sUpdater = ({ id, dispatch, getState, changedCommonData }: UpdateOptions) => {
  const state = getState();
  if (!changedCommonData.has(VMWizardProps.openshiftFlag)) {
    return;
  }
  const openshiftFlag = iGetCommonData(state, id, VMWizardProps.openshiftFlag);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.WORKLOAD_PROFILE]: {
        isHidden: asHidden(!openshiftFlag, FLAGS.OPENSHIFT),
        isRequired: asRequired(openshiftFlag),
      },
    }),
  );
};

export const updateVmSettingsState = (options: UpdateOptions) =>
  [
    ...(iGetCommonData(options.getState(), options.id, VMWizardProps.isProviderImport)
      ? getProviders().map((provider) => provider.getStateUpdater)
      : []),
    selectUserTemplateOnLoadedUpdater,
    selectedUserTemplateUpdater,
    provisioningSourceUpdater,
    flavorUpdater,
    osUpdater,
    nativeK8sUpdater,
  ].forEach((updater) => {
    updater && updater(options);
  });
