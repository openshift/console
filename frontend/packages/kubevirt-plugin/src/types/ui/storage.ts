import { ValidationObject } from '@console/shared/src';

export type UIStorageValidation = {
  validations: {
    name?: ValidationObject;
    size?: ValidationObject;
    url?: ValidationObject;
    container?: ValidationObject;
    diskInterface?: ValidationObject;
    pvc?: ValidationObject;
  };
  isValid: boolean;
  hasAllRequiredFilled: boolean;
};

export type UIStorageEditConfig = {
  disableEditing?: boolean;
  isFieldEditableOverride?: {
    source?: boolean;
    url?: boolean;
    pvcNamespace?: boolean;
    pvc?: boolean;
    name?: boolean;
    size?: boolean;
    interface?: boolean;
    storageClass?: boolean;
    volumeMode?: boolean;
    accessMode?: boolean;
  };
};
