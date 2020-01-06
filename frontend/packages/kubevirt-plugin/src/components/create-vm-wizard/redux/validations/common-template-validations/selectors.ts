import { iGetIn } from '../../../../../utils/immutable';
import { CommonTemplatesValidation } from './validation-types';

export const getValidationsFromTemplates = (templates): CommonTemplatesValidation[] => {
  return templates
    .map((relevantTemplate) =>
      JSON.parse(iGetIn(relevantTemplate, ['metadata', 'annotations', 'validations'])),
    )
    .valueSeq()
    .toArray()
    .flat();
};

export const getFieldValidations = (
  validations: CommonTemplatesValidation[],
  jsonPath: string,
): CommonTemplatesValidation[] => {
  return validations.filter((validation) => validation.path.includes(jsonPath));
};
