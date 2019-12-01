import { InitialStepStateGetter } from './types';

export const getVirtualHardwareInitialState: InitialStepStateGetter = () => ({
  value: {},
  isValid: true, // empty Virtual Storages are valid
  hasAllRequiredFilled: true,
  isLocked: false,
  error: null,
});
