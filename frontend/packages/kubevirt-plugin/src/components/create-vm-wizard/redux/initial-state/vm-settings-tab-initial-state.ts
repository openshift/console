import { OrderedSet } from 'immutable';
import { CommonData, VMSettingsField, VMWizardProps } from '../../types';
import { asHidden, asRequired } from '../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { getProviders } from '../../provider-definitions';

export const getInitialVmSettings = (common: CommonData) => {
  const {
    data: { isCreateTemplate, isProviderImport },
  } = common;

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
    [VMSettingsField.DESCRIPTION]: {},
    [VMSettingsField.USER_TEMPLATE]: {
      isHidden: hiddenByProviderOrTemplate,
      initialized: isProviderImport,
    },
    [VMSettingsField.PROVIDER]: {
      isRequired: asRequired(isProviderImport),
      isHidden: asHidden(!isProviderImport),
      providers: getProviders().map((provider) => provider.name),
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
        allProviders[provider.name] = provider.getInitialState();
        return allProviders;
      }, {}),
    },
  };

  Object.keys(fields).forEach((k) => {
    fields[k].key = k;
  });
  return fields;
};

export const getVmSettingsInitialState = (props) => ({
  value: getInitialVmSettings(props),
  isValid: false,
});
