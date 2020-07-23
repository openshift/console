import { OrderedSet } from 'immutable';
import { CommonData, VMSettingsField, VMWizardProps } from '../../types';
import { asDisabled, asHidden, asRequired } from '../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { InitialStepStateGetter, VMSettings } from './types';

export const getInitialVmSettings = (data: CommonData): VMSettings => {
  const {
    data: { isCreateTemplate, isProviderImport, userTemplateName },
  } = data;

  const hiddenByProvider = asHidden(isProviderImport, VMWizardProps.isProviderImport);
  const hiddenByProviderOrTemplate = isProviderImport
    ? hiddenByProvider
    : asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate);

  const isVM = !isCreateTemplate && !isProviderImport;

  const fields = {
    [VMSettingsField.NAME]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.HOSTNAME]: {},
    [VMSettingsField.DESCRIPTION]: {},
    [VMSettingsField.USER_TEMPLATE]: {
      isHidden: hiddenByProviderOrTemplate,
      isDisabled: asDisabled(!!userTemplateName, VMWizardProps.userTemplateName),
      initialized: !(isVM && userTemplateName),
      value: userTemplateName || undefined,
    },
    [VMSettingsField.OPERATING_SYSTEM]: {
      isRequired: asRequired(true),
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
      isHidden: hiddenByProvider,
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
      isHidden: hiddenByProvider,
      skipValidation: true, // validated in storage tab
    },
    [VMSettingsField.IMAGE_URL]: {
      isHidden: hiddenByProvider,
      skipValidation: true, // validated in storage tab
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
