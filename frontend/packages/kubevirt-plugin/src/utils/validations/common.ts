import {
  DNS1123_CONTAINS_ERROR,
  DNS1123_END_ERROR,
  DNS1123_START_ERROR,
  DNS1123_TOO_LONG_ERROR,
  DNS1123_UPPERCASE_ERROR,
  EMPTY_ERROR,
} from './strings';

const alphanumericRegex = '[a-zA-Z0-9]';

export enum ValidationErrorType {
  Error = 'error',
  Warn = 'warning',
  Info = 'info',
}

export const getValidationObject = (
  message,
  type: ValidationErrorType = ValidationErrorType.Error,
) => ({
  message,
  type,
});

// DNS-1123 subdomain
export const validateDNS1123SubdomainValue = (value) => {
  if (!value) {
    return getValidationObject(EMPTY_ERROR, ValidationErrorType.Warn); // handled by UI
  }
  if (value.toLowerCase() !== value) {
    return getValidationObject(DNS1123_UPPERCASE_ERROR);
  }
  if (value.length > 253) {
    return getValidationObject(DNS1123_TOO_LONG_ERROR);
  }
  if (!value.charAt(0).match(alphanumericRegex)) {
    return getValidationObject(DNS1123_START_ERROR);
  }
  if (!value.charAt(value.length - 1).match(alphanumericRegex)) {
    return getValidationObject(DNS1123_END_ERROR);
  }
  for (let i = 1; i < value.length - 1; i++) {
    const char = value.charAt(i);
    if (!char.match('[-a-zA-Z0-9]')) {
      const offender = char.match('\\s') ? 'whitespace characters' : char;
      return getValidationObject(`${DNS1123_CONTAINS_ERROR} ${offender}`);
    }
  }
  return null;
};
