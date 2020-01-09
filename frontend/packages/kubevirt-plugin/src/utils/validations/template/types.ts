export type IntegerValidationResult = {
  isValid: boolean;
  errorMsg: string;
  min?: number;
  max?: number;
  isMinInclusive?: boolean;
  isMaxInclusive?: boolean;
};
