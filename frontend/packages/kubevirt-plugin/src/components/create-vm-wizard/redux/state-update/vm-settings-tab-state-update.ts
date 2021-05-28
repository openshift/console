import { FLAGS } from '@console/shared';

import {
  CUSTOM_FLAVOR,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
} from '../../../../constants/vm';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { iGetAnnotation, iGetPrameterValue } from '../../../../selectors/immutable/common';
import {
  getITemplateDefaultFlavor,
  getITemplateDefaultWorkload,
  iGetDefaultTemplate,
  iGetRelevantTemplate,
  iGetTemplateGuestToolsDisk,
} from '../../../../selectors/immutable/template/combined';
import { iGetIsLoaded, iGetLoadError, toShallowJS } from '../../../../utils/immutable';
import {
  CDI_UPLOAD_POD_ANNOTATION,
  CDI_PVC_PHASE_RUNNING,
} from '../../../cdi-upload-provider/consts';
import {
  getInitialData,
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
  iGetNamespace,
} from '../../selectors/immutable/selectors';
import {
  hasProvisionStorageChanged,
  iGetProvisionSourceStorage,
} from '../../selectors/immutable/storage';
import {
  hasVmSettingsChanged,
  hasVMSettingsValueChanged,
  iGetProvisionSource,
  iGetRelevantTemplateSelectors,
  iGetVmSettingValue,
} from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps, VMWizardStorage } from '../../types';
import { asDisabled, asHidden, asRequired } from '../../utils/utils';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';
import { prefillVmTemplateUpdater } from './prefill-vm-template-state-update';
import { commonTemplatesUpdater } from './vm-common-templates-updater';

const selectTemplateOnLoadedUpdater = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  if (iGetCommonData(state, id, VMWizardProps.isTemplateInitialized)) {
    return;
  }

  const { commonTemplateName } = getInitialData(state, id);

  const commonTemplateReady =
    commonTemplateName &&
    iGetIsLoaded(iGetCommonData(state, id, VMWizardProps.commonTemplates)) &&
    iGetIsLoaded(iGetCommonData(state, id, VMWizardProps.openshiftCNVBaseImages)) &&
    !iGetLoadError(iGetCommonData(state, id, VMWizardProps.openshiftCNVBaseImages));

  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);

  if (commonTemplateReady || iUserTemplate) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateCommonDataValue](
        id,
        [VMWizardProps.isTemplateInitialized],
        true,
      ),
    );

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
  }
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

  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);
  const mountTools = isWindows && (!iUserTemplate || !!iGetTemplateGuestToolsDisk(iUserTemplate));

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettingsField](
      id,
      VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS,
      { isHidden: asHidden(!isWindows, VMSettingsField.OPERATING_SYSTEM), value: mountTools },
    ),
  );

  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);
  const iDefaultTemplate = iCommonTemplates && iGetDefaultTemplate(iCommonTemplates, os);
  const defaultFlavor = getITemplateDefaultFlavor(iDefaultTemplate);
  const defaultWorkload = getITemplateDefaultWorkload(iDefaultTemplate);

  if (defaultFlavor) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateVmSettingsField](
        id,
        VMSettingsField.FLAVOR,
        { value: defaultFlavor.getValue() },
      ),
    );
  }

  if (defaultWorkload) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateVmSettingsField](
        id,
        VMSettingsField.WORKLOAD_PROFILE,
        { value: defaultWorkload.getValue() },
      ),
    );
  }
};

const baseImageUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (iGetCommonData(state, id, VMWizardProps.isProviderImport)) {
    return;
  }
  if (
    // Note(Yaacov Sep-16): We it is not allowd to change baseImage when changing the flavor
    // or workload, user should not see that we have a bug settings the image:
    // we are incurrectly setting the base image using templates instead of using just the os.
    // we should fix that in the future, but currently we should not expose users to that.
    !hasVMSettingsValueChanged(prevState, state, id, VMSettingsField.OPERATING_SYSTEM)
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
    const pvcName = iGetPrameterValue(iTemplate, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
    const pvcNamespace = iGetPrameterValue(iTemplate, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);

    const iBaseImages = iGetLoadedCommonData(state, id, VMWizardProps.openshiftCNVBaseImages);
    iBaseImage =
      pvcName &&
      iBaseImages &&
      iBaseImages
        .valueSeq()
        .find((iPVC) => iGetName(iPVC) === pvcName && iGetNamespace(iPVC) === pvcNamespace);
    iBaseImageUploading =
      iGetAnnotation(iBaseImage, CDI_UPLOAD_POD_ANNOTATION) === CDI_PVC_PHASE_RUNNING;
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
    ? ProvisionSource.DISK.getValue()
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
      [VMSettingsField.CLONE_PVC_NS]: {
        isHidden: asHidden(cloneCommonBaseDiskImage, VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE),
      },
      [VMSettingsField.CLONE_PVC_NAME]: {
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
  const isContainer = [ProvisionSource.CONTAINER, ProvisionSource.CONTAINER_EPHEMERAL].includes(
    source,
  );
  const isUrl = source === ProvisionSource.URL;
  const isPvc = source === ProvisionSource.DISK;
  let hasPVCns = false;
  if (isPvc) {
    const provisionStorage = iGetProvisionSourceStorage(state, id);
    const storage = toShallowJS<VMWizardStorage>(provisionStorage);
    const dataVolumeWrapper = new DataVolumeWrapper(storage?.dataVolume);
    hasPVCns = !!dataVolumeWrapper.getPersistentVolumeClaimNamespace();
  }

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.CONTAINER_IMAGE]: {
        isHidden: asHidden(!isContainer, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
      [VMSettingsField.IMAGE_URL]: {
        isHidden: asHidden(!isUrl, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
      [VMSettingsField.CLONE_PVC_NS]: {
        isHidden: asHidden(!isPvc, VMSettingsField.PROVISION_SOURCE_TYPE),
      },
      [VMSettingsField.CLONE_PVC_NAME]: {
        isHidden: asHidden(!(isPvc && hasPVCns), VMSettingsField.CLONE_PVC_NS),
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

const cloneSourceUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (!hasProvisionStorageChanged(prevState, state, id)) {
    return;
  }
  const provisionStorage = iGetProvisionSourceStorage(state, id);
  const storage = toShallowJS<VMWizardStorage>(provisionStorage);
  if (!storage?.dataVolume) {
    return;
  }
  const dataVolumeWrapper = new DataVolumeWrapper(storage.dataVolume);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.CLONE_PVC_NAME]: {
        isHidden: asHidden(
          !dataVolumeWrapper.getPersistentVolumeClaimNamespace(),
          VMSettingsField.CLONE_PVC_NS,
        ),
      },
    }),
  );
};

export const updateVmSettingsState = (options: UpdateOptions) =>
  [
    selectTemplateOnLoadedUpdater,
    osUpdater,
    baseImageUpdater,
    cloneCommonBaseDiskImageUpdater,
    templateConsistencyUpdater,
    provisioningSourceUpdater,
    nativeK8sUpdater,
    flavorUpdater,
    commonTemplatesUpdater,
    cloneSourceUpdater,
  ].forEach((updater) => {
    updater && updater(options);
  });
