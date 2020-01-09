import { iGetIn } from '../../../utils/immutable';
import { CommonTemplatesValidation, ITemplate } from '../../../types/template';

export const iGetTemplateValidations = (template: ITemplate): CommonTemplatesValidation[] => {
  const result = iGetIn(template, ['metadata', 'annotations', 'validations']);

  try {
    return result ? JSON.parse(result) : [];
  } catch (e) {
    return [];
  }
};
