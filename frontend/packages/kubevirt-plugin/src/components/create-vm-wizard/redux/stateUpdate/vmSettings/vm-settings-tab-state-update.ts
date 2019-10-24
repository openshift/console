import {
  hasVmSettingsChanged,
  iGetProvisionSource,
  iGetVmSettingAttribute,
  iGetVmSettingValue,
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
import { iGetIsLoaded, iGetLoadedData } from '../../../../../utils/immutable';
import { ignoreCaseSort } from '../../../../../utils/sort';
import { CUSTOM_FLAVOR } from '../../../../../constants/vm';
import { ProvisionSource } from '../../../../../constants/vm/provision-source';
import { getProviders } from '../../../provider-definitions';
import { prefillVmTemplateUpdater } from './prefill-vm-template-state-update';

export const selectUserTemplateOnLoadedUpdater = ({
  id,
  dispatch,
  getState,
  changedCommonData,
}: UpdateOptions) => {
  const state = getState();
  if (
    iGetCommonData(state, id, VMWizardProps.isCreateTemplate) ||
    iGetVmSettingAttribute(state, id, VMSettingsField.USER_TEMPLATE, 'initialized') ||
    !(
      changedCommonData.has(VMWizardProps.userTemplates) ||
      changedCommonData.has(VMWizardProps.commonTemplates)
    )
  ) {
    return;
  }

  const iUserTemplatesWrapper = iGetCommonData(state, id, VMWizardProps.userTemplates);
  const iCommonTemplatesWrapper = iGetCommonData(state, id, VMWizardProps.commonTemplates); // flavor prefill

  if (!iGetIsLoaded(iUserTemplatesWrapper) || !iGetIsLoaded(iCommonTemplatesWrapper)) {
    return;
  }

  const iUserTemplates = iGetLoadedData(iUserTemplatesWrapper);

  const firstUserTemplateName = ignoreCaseSort(
    iUserTemplates
      .toIndexedSeq()
      .toArray()
      .map(iGetName),
  )[0];

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.USER_TEMPLATE]: {
        initialized: true,
        value: firstUserTemplateName,
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

  if (iGetVmSettingAttribute(state, id, VMSettingsField.USER_TEMPLATE, 'initialized')) {
    prefillVmTemplateUpdater(options);
  }
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

export const updateVmSettingsState = (options: UpdateOptions) =>
  [
    ...(iGetCommonData(options.getState(), options.id, VMWizardProps.isProviderImport)
      ? getProviders().map((provider) => provider.getStateUpdater)
      : []),
    selectUserTemplateOnLoadedUpdater,
    selectedUserTemplateUpdater,
    provisioningSourceUpdater,
    flavorUpdater,
  ].forEach((updater) => {
    updater && updater(options);
  });
