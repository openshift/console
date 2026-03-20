/**
 * Add new error message to {@link window.windowError} for Cypress test purposes.
 *
 * This is a functional alternative to manually updating the `windowError` value.
 */
export const addTestError = (message: string) => {
  if (message) {
    window.windowError = window.windowError ?? '';
    window.windowError += `${window.windowError.length > 0 ? '; ' : ''}${message}`;
  }
};
