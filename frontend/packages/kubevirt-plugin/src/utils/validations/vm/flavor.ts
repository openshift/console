import { ValidationObject, validateEmptyValue } from '@console/shared/src';

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
    validations.memory = validateEmptyValue(size, { subject: 'Memory' });
    validations.cpus = validateEmptyValue(cpus, { subject: 'CPUs' });
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
