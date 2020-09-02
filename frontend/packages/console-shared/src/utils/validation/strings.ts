export const EMPTY_ERROR = 'cannot be empty';

export const DNS1123_START_END_ERROR = 'has to start/end with alphanumeric characters';
export const DNS1123_START_ERROR = 'has to start with alphanumeric character';
export const DNS1123_END_ERROR = 'has to end with alphanumeric character';

export const getStringTooShortErrorMsg = (minLength: number): string =>
  `cannot have fewer than ${minLength} characters`;
export const getStringTooLongErrorMsg = (maxLength: number): string =>
  `cannot have more than ${maxLength} characters`;
