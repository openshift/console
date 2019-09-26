export enum ValidationErrorType {
  Error = 'error',
  TrivialError = 'trivial-error',
  Warn = 'warning',
  Info = 'info',
}

export type ValidationObject = {
  message: string;
  type?: ValidationErrorType;
};
