import { OvirtSettings } from '../types';
import { OvirtProviderField, VMImportProvider } from '../../../types';
import { asDisabled, asHidden } from '../../../utils/utils';
import { V2VProviderStatus } from '../../../../../statuses/v2v';

export const getOvirtInitialState = (): OvirtSettings => {
  const hiddenByOvirtEngine = asHidden(true, OvirtProviderField.OVIRT_ENGINE_SECRET_NAME);
  const fields = {
    [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: {},
    [OvirtProviderField.API_URL]: {
      isHidden: hiddenByOvirtEngine,
      value: 'https://',
    },
    [OvirtProviderField.CERTIFICATE]: {
      isHidden: hiddenByOvirtEngine,
      filename: '',
    },
    [OvirtProviderField.USERNAME]: {
      isHidden: hiddenByOvirtEngine,
    },
    [OvirtProviderField.PASSWORD]: {
      isHidden: hiddenByOvirtEngine,
    },
    [OvirtProviderField.REMEMBER_PASSWORD]: {
      isHidden: hiddenByOvirtEngine,
      value: true,
    },
    [OvirtProviderField.VM]: {
      isDisabled: asDisabled(true, OvirtProviderField.VM),
    },
    [OvirtProviderField.CLUSTER]: {
      isDisabled: asDisabled(true, OvirtProviderField.CLUSTER),
    },
    [OvirtProviderField.STATUS]: {
      isHidden: asHidden(true, VMImportProvider.OVIRT),
      value: V2VProviderStatus.UNKNOWN.getValue(),
    },

    [OvirtProviderField.CONTROLLER_LAST_ERROR]: {
      isHidden: asHidden(true, OvirtProviderField.CONTROLLER_LAST_ERROR),
    },

    // simple values
    [OvirtProviderField.CURRENT_OVIRT_PROVIDER_CR_NAME]: null,
    [OvirtProviderField.CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME]: null,
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k]) {
      fields[k].key = k;
    }
  });
  return fields;
};
