export enum ValidationErrorType {
  Error = 'error',
  TrivialError = 'trivial-error', // should not be visible but affects data validation
  Warn = 'warning',
  Info = 'info',
}

export type ValidationObject = {
  messageKey: string;
  type?: ValidationErrorType;
};

export const asValidationObject = (
  messageKey: string,
  type: ValidationErrorType = ValidationErrorType.Error,
): ValidationObject => ({
  messageKey,
  type,
});
