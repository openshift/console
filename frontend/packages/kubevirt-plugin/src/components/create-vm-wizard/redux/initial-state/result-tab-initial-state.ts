import { InitialStepStateGetter } from './types';

export const getResultInitialState: InitialStepStateGetter = () => ({
  value: {
    mainError: null,
    errors: [],
    requestResults: [],
  },
  error: null,
  isLocked: false,
  hasAllRequiredFilled: null,
  isValid: null,
  isPending: false,
});
