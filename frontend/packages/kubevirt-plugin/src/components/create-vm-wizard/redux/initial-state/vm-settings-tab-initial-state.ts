import { OrderedSet } from 'immutable';
import { CommonData, VMSettingsField, VMWizardProps } from '../../types';
import { asHidden, asRequired } from '../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { InitialStepStateGetter, VMSettings } from './types';

export const getInitialVmSettings = (data: CommonData): VMSettings => {
  const {
    data: { isCreateTemplate, isProviderImport, name, commonTemplateName },
  } = data;

  const hiddenByProvider = asHidden(isProviderImport, VMWizardProps.isProviderImport);
  const hiddenByProviderOrTemplate = isProviderImport
    ? hiddenByProvider
    : asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate);
  const hiddenByProviderOrCloneCommonBaseDiskImage = isProviderImport
    ? hiddenByProvider
    : asHidden(false);
  const hiddenByOperatingSystem = asHidden(true, VMSettingsField.OPERATING_SYSTEM);

  const fields = {
    [VMSettingsField.NAME]: {
      isRequired: asRequired(true),
      validations: [],
      value: name || undefined,
    },
    [VMSettingsField.HOSTNAME]: {},
    [VMSettingsField.DESCRIPTION]: {},
    [VMSettingsField.OPERATING_SYSTEM]: {
      initialized: !commonTemplateName,
      isRequired: asRequired(true),
    },
    [VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE]: {
      value: false,
      isHidden: hiddenByOperatingSystem,
    },
    [VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS]: {
      value: false,
      isHidden: asHidden(true, VMSettingsField.OPERATING_SYSTEM),
    },
    [VMSettingsField.FLAVOR]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.MEMORY]: {
      binaryUnitValidation: true,
    },
    [VMSettingsField.CPU]: {},
    [VMSettingsField.WORKLOAD_PROFILE]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.PROVISION_SOURCE_TYPE]: {
      isHidden: hiddenByProviderOrCloneCommonBaseDiskImage,
      isRequired: asRequired(!isProviderImport),
      sources: OrderedSet(
        [
          ProvisionSource.PXE,
          ProvisionSource.URL,
          ProvisionSource.CONTAINER,
          ProvisionSource.DISK,
        ].map((source) => source.getValue()),
      ),
    },
    [VMSettingsField.CONTAINER_IMAGE]: {
      isHidden: hiddenByProviderOrCloneCommonBaseDiskImage,
    },
    [VMSettingsField.IMAGE_URL]: {
      isHidden: hiddenByProviderOrCloneCommonBaseDiskImage,
    },
    [VMSettingsField.START_VM]: {
      value: false,
      isHidden: hiddenByProviderOrTemplate,
    },
  };

  Object.keys(fields).forEach((k) => {
    fields[k].key = k;
  });
  return fields;
};

export const getVmSettingsInitialState: InitialStepStateGetter = (data) => ({
  value: getInitialVmSettings(data),
  error: null,
  hasAllRequiredFilled: false,
  isValid: false,
  isLocked: false,
  isHidden: data.data.isProviderImport && data.data.isSimpleView,
  isCreateDisabled: false,
  isUpdateDisabled: false,
  isDeleteDisabled: false,
});
