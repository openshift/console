import { CloudInitField } from '../../types';

export const getCloudInitInitialState = () => ({
  value: {
    [CloudInitField.IS_FORM]: {
      value: true,
    },
  },
  isValid: true,
  hasAllRequiredFilled: true,
  error: null,
});
