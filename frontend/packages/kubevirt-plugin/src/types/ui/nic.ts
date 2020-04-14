import { ValidationObject } from '@console/shared/src';

export type UINetworkInterfaceValidation = {
  validations: {
    name?: ValidationObject;
    macAddress?: ValidationObject;
    network?: ValidationObject;
  };
  isValid: boolean;
  hasAllRequiredFilled: boolean;
};

export type UINetworkEditConfig = {
  disableEditing?: boolean;
  isFieldEditableOverride?: {
    name?: boolean;
    model?: boolean;
    network?: boolean;
    type?: boolean;
    macAddress?: boolean;
  };
  acceptEmptyValuesOverride?: {
    network?: boolean;
  };
};
