import { CommonTemplatesValidation, ITemplate } from '../../../types/template';
import { iGetIn } from '../../../utils/immutable';

export const iGetTemplateValidations = (template: ITemplate): CommonTemplatesValidation[] => {
  const result = iGetIn(template, ['metadata', 'annotations', 'validations']);

  try {
    return result ? JSON.parse(result) : [];
  } catch (e) {
    return [];
  }
};
