import { CloudInitField, CommonData } from '../../types';
import { InitialStepStateGetter } from './types';

export const getAdvancedTabInitialData: InitialStepStateGetter = (data: CommonData) => ({
  value: {
    [CloudInitField.IS_FORM]: {
      value: true,
    },
    [CloudInitField.AUTH_KEYS]: {
      value: [],
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
