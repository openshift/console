import { CloudInitField } from '../../types';
import { InitialStepStateGetter } from './types';

export const getCloudInitInitialState: InitialStepStateGetter = () => ({
  value: {
    [CloudInitField.IS_FORM]: {
      value: true,
    },
  },
  error: null,
  isValid: true,
  hasAllRequiredFilled: true,
  isLocked: false,
});
