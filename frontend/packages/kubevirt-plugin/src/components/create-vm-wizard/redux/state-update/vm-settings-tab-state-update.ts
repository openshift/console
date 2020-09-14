import { FLAGS } from '@console/shared';
import {
  hasVmSettingsChanged,
  hasVMSettingsValueChanged,
  iGetProvisionSource,
  iGetRelevantTemplateSelectors,
  iGetVmSettingValue,
} from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { asDisabled, asHidden, asRequired } from '../../utils/utils';
import { vmWizardInternalActions } from '../internal-actions';
import {
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
  iGetNamespace,
} from '../../selectors/immutable/selectors';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import {
  CUSTOM_FLAVOR,
  TEMPLATE_DATAVOLUME_NAME_PARAMETER,
  TEMPLATE_DATAVOLUME_NAMESPACE_PARAMETER,
} from '../../../../constants/vm';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { prefillVmTemplateUpdater } from './prefill-vm-template-state-update';
import { iGetPrameterValue, iGetAnnotation } from '../../../../selectors/immutable/common';
import { CDI_UPLOAD_POD_ANNOTATION, CDI_UPLOAD_RUNNING } from '../../../cdi-upload-provider/consts';

const selectUserTemplateOnLoadedUpdater = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  if (
    iGetCommonData(state, id, VMWizardProps.isUserTemplateInitialized) ||
    !iGetLoadedCommonData(state, id, VMWizardProps.userTemplate)
  ) {
    return;
  }

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateCommonDataValue](
      id,
      [VMWizardProps.isUserTemplateInitialized],
      true,
    ),
  );

  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);
  const isDisabled = asDisabled(iUserTemplate != null, VMWizardProps.userTemplate);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.PROVISION_SOURCE_TYPE]: { isDisabled },
      [VMSettingsField.CONTAINER_IMAGE]: { isDisabled },
      [VMSettingsField.IMAGE_URL]: { isDisabled },
      [VMSettingsField.OPERATING_SYSTEM]: { isDisabled },
      [VMSettingsField.WORKLOAD_PROFILE]: { isDisabled },
      [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE]: {
        isHidden: asHidden(iUserTemplate != null, VMWizardProps.userTemplate),
      },
    }),
  );

  prefillVmTemplateUpdater(options);
};

const osUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (iGetCommonData(state, id, VMWizardProps.isProviderImport)) {
    return;
  }
  if (!hasVMSettingsValueChanged(prevState, state, id, VMSettingsField.OPERATING_SYSTEM)) {
    return;
  }

  const os = iGetVmSettingValue(state, id, VMSettingsField.OPERATING_SYSTEM);
  const isWindows = os?.startsWith('win');

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettingsField](
      id,
      VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS,
      { isHidden: asHidden(!isWindows, VMSettingsField.OPERATING_SYSTEM), value: isWindows },
    ),
  );
};

const baseImageUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (iGetCommonData(state, id, VMWizardProps.isProviderImport)) {
    return;
  }
  if (
    !hasVMSettingsValueChanged(
      prevState,
      state,
      id,
      VMSettingsField.OPERATING_SYSTEM,
      VMSettingsField.FLAVOR,
      VMSettingsField.WORKLOAD_PROFILE,
    )
  ) {
    return;
  }

  const iUserTemplate = iGetCommonData(state, id, VMWizardProps.userTemplate);
  let iBaseImage = null;
  let iBaseImageUploading = false;

  // cloneCommonBaseDiskImage can be set true only if userTemplate is not used
  if (!iUserTemplate) {
    const relevantOptions = iGetRelevantTemplateSelectors(state, id);
    const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);
    const iTemplate = iCommonTemplates && iGetRelevantTemplate(iCommonTemplates, relevantOptions);
    const pvcName = iGetPrameterValue(iTemplate, TEMPLATE_DATAVOLUME_NAME_PARAMETER);
    const pvcNamespace = iGetPrameterValue(iTemplate, TEMPLATE_DATAVOLUME_NAMESPACE_PARAMETER);

    const iBaseImages = iGetLoadedCommonData(state, id, VMWizardProps.openshiftCNVBaseImages);
    iBaseImage =
      pvcName &&
      iBaseImages &&
      iBaseImages
        .valueSeq()
        .find((iPVC) => iGetName(iPVC) === pvcName && iGetNamespace(iPVC) === pvcNamespace);
    iBaseImageUploading =
      iGetAnnotation(iBaseImage, CDI_UPLOAD_POD_ANNOTATION) === CDI_UPLOAD_RUNNING;
  }

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettingsField](
      id,
      VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE,
      {
        isHidden: asHidden(!iBaseImage, VMSettingsField.OPERATING_SYSTEM),
        isDisabled: asDisabled(iBaseImageUploading, VMSettingsField.OPERATING_SYSTEM),
        value: iBaseImageUploading ? false : !!iBaseImage,
      },
    ),
  );
};

const cloneCommonBaseDiskImageUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();

  if (iGetCommonData(state, id, VMWizardProps.isProviderImport)) {
    return;
  }
  if (
    !hasVMSettingsValueChanged(prevState, state, id, VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE)
  ) {
    return;
  }

  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);
  const cloneCommonBaseDiskImage = iGetVmSettingValue(
    state,
    id,
    VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE,
  );

  // userTemplate should have its own provision source
  // in cases userTemplate is define we send `undefined` (undefined means no update)
  const provisionSourceTypeValue = iUserTemplate
    ? undefined
    : cloneCommonBaseDiskImage
    ? ProvisionSource.DISK.toString()
    : '';

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.PROVISION_SOURCE_TYPE]: {
        isHidden: asHidden(cloneCommonBaseDiskImage, VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE),
        value: provisionSourceTypeValue,
      },
      [VMSettingsField.CONTAINER_IMAGE]: {
        isHidden: asHidden(cloneCommonBaseDiskImage, VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE),
      },
      [VMSettingsField.IMAGE_URL]: {
        isHidden: asHidden(cloneCommonBaseDiskImage, VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE),
      },
    }),
  );
};

const templateConsistencyUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (
    !hasVMSettingsValueChanged(
      prevState,
      state,
      id,
      VMSettingsField.WORKLOAD_PROFILE,
      VMSettingsField.OPERATING_SYSTEM,
    )
  ) {
    return;
  }
  const selectors = iGetRelevantTemplateSelectors(state, id);
  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  if (!iUserTemplate && !iGetRelevantTemplate(iCommonTemplates, selectors)) {
    // Reset workload and flavor profile if no relevant template found
    // Could be triggered by provider prefil or os selection
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
        [VMSettingsField.WORKLOAD_PROFILE]: { value: null },
        [VMSettingsField.FLAVOR]: { value: null },
      }),
    );
  }
};

const provisioningSourceUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (!hasVmSettingsChanged(prevState, state, id, VMSettingsField.PROVISION_SOURCE_TYPE)) {
    return;
  }
  const source = iGetProvisionSource(state, id);
  const isContainer = source === ProvisionSource.CONTAINER;
  const isUrl = source === ProvisionSource.URL;

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.CONTAINER_IMAGE]: {
        isHidden: asHidden(!isContainer, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
      [VMSettingsField.IMAGE_URL]: {
        isHidden: asHidden(!isUrl, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
    }),
  );
};

const nativeK8sUpdater = ({ id, dispatch, getState, changedCommonData }: UpdateOptions) => {
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

const flavorUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
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
    selectUserTemplateOnLoadedUpdater,
    osUpdater,
    baseImageUpdater,
    cloneCommonBaseDiskImageUpdater,
    templateConsistencyUpdater,
    provisioningSourceUpdater,
    nativeK8sUpdater,
    flavorUpdater,
  ].forEach((updater) => {
    updater && updater(options);
  });
