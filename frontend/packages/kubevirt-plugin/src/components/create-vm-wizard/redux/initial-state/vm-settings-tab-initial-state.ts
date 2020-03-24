import { OrderedSet } from 'immutable';
import { CommonData, VMSettingsField, VMWizardProps } from '../../types';
import { asHidden, asRequired } from '../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { getProviders } from '../../provider-definitions';
import { InitialStepStateGetter, VMSettings } from './types';

export const vmSettingsOrder = {
  [VMSettingsField.NAME]: 0,
  [VMSettingsField.DESCRIPTION]: 1,
  [VMSettingsField.USER_TEMPLATE]: 2,
  [VMSettingsField.PROVIDER]: 3,
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 4,
  [VMSettingsField.CONTAINER_IMAGE]: 5,
  [VMSettingsField.IMAGE_URL]: 6,
  [VMSettingsField.OPERATING_SYSTEM]: 7,
  [VMSettingsField.FLAVOR]: 8,
  [VMSettingsField.MEMORY]: 9,
  [VMSettingsField.CPU]: 10,
  [VMSettingsField.WORKLOAD_PROFILE]: 11,
  [VMSettingsField.START_VM]: 12,
};

export const getInitialVmSettings = (data: CommonData): VMSettings => {
  const {
    data: { isCreateTemplate, isProviderImport },
  } = data;

  const hiddenByProvider = asHidden(isProviderImport, VMWizardProps.isProviderImport);
  const hiddenByProviderOrTemplate = isProviderImport
    ? hiddenByProvider
    : asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate);

  const provisionSources = (isProviderImport
    ? [ProvisionSource.IMPORT]
    : [ProvisionSource.PXE, ProvisionSource.URL, ProvisionSource.CONTAINER, ProvisionSource.DISK]
  ).map((source) => source.getValue());

  const fields = {
    [VMSettingsField.NAME]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.HOSTNAME]: {},
    [VMSettingsField.DESCRIPTION]: {},
    [VMSettingsField.USER_TEMPLATE]: {
      isHidden: hiddenByProviderOrTemplate,
    },
    [VMSettingsField.PROVIDER]: {
      isRequired: asRequired(isProviderImport),
      isHidden: asHidden(!isProviderImport),
      providers: getProviders().map((provider) => ({ name: provider.name, id: provider.id })),
    },
    [VMSettingsField.PROVISION_SOURCE_TYPE]: {
      value: isProviderImport ? ProvisionSource.IMPORT.getValue() : undefined,
      isHidden: hiddenByProvider,
      isRequired: asRequired(true),
      sources: OrderedSet(provisionSources),
    },
    [VMSettingsField.CONTAINER_IMAGE]: {
      isHidden: hiddenByProvider,
      skipValidation: true, // validated in storage tab
    },
    [VMSettingsField.IMAGE_URL]: {
      isHidden: hiddenByProvider,
      skipValidation: true, // validated in storage tab
    },
    [VMSettingsField.OPERATING_SYSTEM]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.FLAVOR]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.MEMORY]: {},
    [VMSettingsField.CPU]: {},
    [VMSettingsField.WORKLOAD_PROFILE]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.START_VM]: {
      value: false,
      isHidden: hiddenByProviderOrTemplate,
    },
    [VMSettingsField.PROVIDERS_DATA]: {
      ...getProviders().reduce((allProviders, provider) => {
        allProviders[provider.id] = provider.getInitialState();
        return allProviders;
      }, {}),
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
});
