export enum ValidationErrorType {
  Error = 'error',
  TrivialError = 'trivial-error', // should not be visible but affects data validation
  Warn = 'warning',
  Info = 'info',
}

export type ValidationObject = {
  message: string;
  type?: ValidationErrorType;
};
