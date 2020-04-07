import { VMImportProvider, VMWareProviderField } from '../../../types';
import { asDisabled, asHidden } from '../../../utils/utils';
import { V2VProviderStatus } from '../../../../../statuses/v2v';
import { VMwareSettings } from '../types';

export const getVmWareInitialState = (): VMwareSettings => {
  const hiddenByVCenter = asHidden(true, VMWareProviderField.VCENTER_SECRET_NAME);
  const fields = {
    [VMWareProviderField.VCENTER_SECRET_NAME]: {},
    [VMWareProviderField.HOSTNAME]: {
      isHidden: hiddenByVCenter,
    },
    [VMWareProviderField.USERNAME]: {
      isHidden: hiddenByVCenter,
    },
    [VMWareProviderField.PASSWORD]: {
      isHidden: hiddenByVCenter,
    },
    [VMWareProviderField.REMEMBER_PASSWORD]: {
      isHidden: hiddenByVCenter,
      value: true,
    },
    [VMWareProviderField.VM]: {
      isDisabled: asDisabled(true, VMWareProviderField.VM),
    },
    [VMWareProviderField.STATUS]: {
      isHidden: asHidden(true, VMImportProvider.VMWARE),
      value: V2VProviderStatus.UNKNOWN.getValue(),
    },
    [VMWareProviderField.CONTROLLER_LAST_ERROR]: {
      isHidden: asHidden(true, VMWareProviderField.CONTROLLER_LAST_ERROR),
    },

    // simple values
    [VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME]: null,
    [VMWareProviderField.CURRENT_RESOLVED_VCENTER_SECRET_NAME]: null,
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k]) {
      fields[k].key = k;
    }
  });
  return fields;
};
