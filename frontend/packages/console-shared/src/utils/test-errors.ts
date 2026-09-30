/**
 * Add new error message to {@link window.windowError} for E2E test purposes.
 */
export const addTestError = (message: string) => {
  if (message) {
    window.windowError = window.windowError ?? '';
    window.windowError += `${window.windowError.length > 0 ? '; ' : ''}${message}`;
  }
};
