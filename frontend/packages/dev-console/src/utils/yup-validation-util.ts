export const isInteger = (message) => ({
  test(value) {
    return value == null || Number.isInteger(value);
  },
  message,
});
