import { OvirtSettings } from '../types';
import { OvirtProviderField } from '../../../types';
import { asHidden } from '../../../utils/utils';

export const getOvirtInitialState = (): OvirtSettings => {
  const fields = {
    [OvirtProviderField.API_URL]: {},
    [OvirtProviderField.USERNAME]: {},
    [OvirtProviderField.PASSWORD]: {},
    [OvirtProviderField.REMEMBER_PASSWORD]: {
      value: true,
    },
    [OvirtProviderField.CERTIFICATE]: {},
    [OvirtProviderField.CONTROLLER_LAST_ERROR]: {
      isHidden: asHidden(true, OvirtProviderField.CONTROLLER_LAST_ERROR),
    },
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k]) {
      fields[k].key = k;
    }
  });
  return fields;
};
