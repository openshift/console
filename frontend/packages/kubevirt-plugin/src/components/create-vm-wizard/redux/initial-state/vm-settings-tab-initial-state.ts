import { OrderedSet } from 'immutable';
import { CommonData, VMSettingsField, VMWizardProps } from '../../types';
import { asHidden, asRequired } from '../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';

export const getInitialVmSettings = (common: CommonData) => {
  const {
    data: { isCreateTemplate },
  } = common;

  const provisionSources = [
    ProvisionSource.PXE,
    ProvisionSource.URL,
    ProvisionSource.CONTAINER,
    ProvisionSource.DISK,
  ].map((source) => source.getValue());

  const fields = {
    [VMSettingsField.NAME]: {
      isRequired: asRequired(true),
    },
    [VMSettingsField.DESCRIPTION]: {},
    [VMSettingsField.USER_TEMPLATE]: {
      isHidden: asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate),
      initialized: false,
    },
    [VMSettingsField.PROVISION_SOURCE_TYPE]: {
      isRequired: asRequired(true),
      sources: OrderedSet(provisionSources),
    },
    [VMSettingsField.CONTAINER_IMAGE]: {
      skipValidation: true, // validated in storage tab
    },
    [VMSettingsField.IMAGE_URL]: {
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
      isHidden: asHidden(isCreateTemplate, VMWizardProps.isCreateTemplate),
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
