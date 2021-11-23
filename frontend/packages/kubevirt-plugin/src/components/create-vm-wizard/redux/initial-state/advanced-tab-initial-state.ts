import { CloudInitField, CommonData, HardwareDevicesField } from '../../types';
import { InitialStepStateGetter } from './types';

export const getAdvancedTabInitialData: InitialStepStateGetter = (data: CommonData) => ({
  value: {
    [CloudInitField.IS_FORM]: {
      value: true,
    },
    [CloudInitField.AUTH_KEYS]: {
      value: [],
    },
    [HardwareDevicesField.GPUS]: {
      value: [],
    },
    [HardwareDevicesField.HOST_DEVICES]: {
      value: [],
    },
    [HardwareDevicesField.IS_DEVICES_INITIALIZED]: {
      value: false,
    },
  },
  error: null,
  isValid: true,
  hasAllRequiredFilled: true,
  isLocked: false,
  isHidden: data.data.isProviderImport && data.data.isSimpleView,
  isCreateDisabled: false,
  isUpdateDisabled: false,
  isDeleteDisabled: false,
});
