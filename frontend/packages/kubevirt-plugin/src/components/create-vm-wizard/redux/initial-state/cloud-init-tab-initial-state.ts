import { CloudInitField, CommonData } from '../../types';
import { InitialStepStateGetter } from './types';

export const getCloudInitInitialState: InitialStepStateGetter = (data: CommonData) => ({
  value: {
    [CloudInitField.IS_FORM]: {
      value: true,
    },
  },
  error: null,
  isValid: true,
  hasAllRequiredFilled: true,
  isLocked: false,
  isHidden: data.data.isProviderImport && data.data.isSimpleView,
});
