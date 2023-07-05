export const isInteger = (message) => ({
  test(value) {
    return value == null || Number.isInteger(value);
  },
  message,
});

export const bitBucketUserNameRegex = /^[a-z]([a-z0-9_]-?)*[a-z0-9]$/;
