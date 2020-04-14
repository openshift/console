import { InitialStepStateGetter } from './types';

export const getResultInitialState: InitialStepStateGetter = () => ({
  value: {
    isFatal: null,
    mainError: null,
    errors: [],
    requestResults: [],
  },
  error: null,
  isLocked: false,
  hasAllRequiredFilled: null,
  isValid: null,
  isPending: false,
  isHidden: false,
  isCreateDisabled: false,
  isUpdateDisabled: false,
  isDeleteDisabled: false,
});
