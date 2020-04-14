import { InitialStepStateGetter } from './types';
import { CommonData } from '../../types';

export const getVirtualHardwareInitialState: InitialStepStateGetter = (data: CommonData) => ({
  value: {},
  isValid: true, // empty Virtual Storages are valid
  hasAllRequiredFilled: true,
  isLocked: false,
  error: null,
  isHidden: data.data.isProviderImport && data.data.isSimpleView,
  isCreateDisabled: false,
  isUpdateDisabled: false,
  isDeleteDisabled: false,
});
