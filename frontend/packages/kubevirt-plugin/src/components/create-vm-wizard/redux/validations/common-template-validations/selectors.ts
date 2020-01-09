import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import { iGetIn } from '../../../../../utils/immutable';
import { CommonTemplatesValidation } from './validation-types';

export const getValidationsFromTemplates = (
  templates: TemplateKind[],
  jsonPath: string,
): CommonTemplatesValidation[] => {
  const templateValidations: CommonTemplatesValidation[][] = templates.map((relevantTemplate) =>
    JSON.parse(iGetIn(relevantTemplate, ['metadata', 'annotations', 'validations'])).filter(
      (validation: CommonTemplatesValidation) => validation.path.includes(jsonPath),
    ),
  );

  // If we have a template with no restrictions, ignore all other validation rules, the most
  // relax option take
  if (templateValidations.find((validations) => validations.length === 0)) {
    return [];
  }

  return _.flatten(templateValidations);
};
