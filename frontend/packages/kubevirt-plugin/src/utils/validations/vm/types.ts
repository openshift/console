import { ValidationObject } from '@console/shared/src';

export type UIDiskValidation = {
  validations: {
    name?: ValidationObject;
    size?: ValidationObject;
    url?: ValidationObject;
    container?: ValidationObject;
    diskInterface: ValidationObject;
    pvc?: ValidationObject;
  };
  isValid: boolean;
  hasAllRequiredFilled: boolean;
};
