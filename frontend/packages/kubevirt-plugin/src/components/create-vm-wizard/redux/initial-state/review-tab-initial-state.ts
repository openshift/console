import { InitialStepStateGetter } from './types';

export const getReviewInitialState: InitialStepStateGetter = () => ({
  value: {},
  error: null,
  isValid: true,
  hasAllRequiredFilled: true,
  isLocked: false,
  isHidden: false,
  isCreateDisabled: false,
  isUpdateDisabled: false,
  isDeleteDisabled: false,
});
