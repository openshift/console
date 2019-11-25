export const getResultInitialState = () => ({
  value: {
    mainError: null,
    errors: [],
    requestResults: [],
  },
  isValid: null,
  isPending: false,
  error: null,
});
