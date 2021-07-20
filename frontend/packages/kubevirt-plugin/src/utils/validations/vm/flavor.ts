import { asValidationObject, ValidationErrorType, ValidationObject } from '../../../selectors';

export const validateFlavor = (
  {
    memory: { unit, size },
    cpus,
  }: {
    memory: { size: string; unit: string };
    cpus: string;
  },
  { isCustomFlavor }: { isCustomFlavor: boolean },
): UIFlavorValidation => {
  const validations = {
    memory: null,
    cpus: null,
  };

  let hasAllRequiredFilled = true;

  const addRequired = (addon) => {
    if (hasAllRequiredFilled) {
      hasAllRequiredFilled = hasAllRequiredFilled && addon;
    }
  };

  if (isCustomFlavor) {
    addRequired(unit);
    addRequired(size);
    addRequired(cpus);
    validations.memory = size
      ? null
      : // t('kubevirt-plugin~Memory cannot be empty')
        asValidationObject(
          'kubevirt-plugin~Memory cannot be empty',
          ValidationErrorType.TrivialError,
        );
    validations.cpus = cpus
      ? null
      : // t('kubevirt-plugin~CPU cannot be empty')
        asValidationObject('kubevirt-plugin~CPU cannot be empty', ValidationErrorType.TrivialError);
  }

  return {
    validations,
    hasAllRequiredFilled: !!hasAllRequiredFilled,
    isValid: !!hasAllRequiredFilled && !Object.keys(validations).find((key) => validations[key]),
  };
};

export type UIFlavorValidation = {
  validations: {
    memory?: ValidationObject;
    cpus?: ValidationObject;
  };
  isValid: boolean;
  hasAllRequiredFilled: boolean;
};
