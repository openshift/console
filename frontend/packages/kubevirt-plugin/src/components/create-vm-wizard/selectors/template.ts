import { iGetTemplateValidations } from '../../../selectors/immutable/template/selectors';
import { TemplateValidations } from '../../../utils/validations/template/template-validations';
import {
  iGetRelevantTemplate,
  iGetRelevantTemplates,
} from '../../../selectors/immutable/template/combined';
import { VMWizardProps } from '../types';
import { iGetLoadedCommonData } from './immutable/selectors';
import { iGetRelevantTemplateSelectors } from './immutable/vm-settings';

const getValidationsFromTemplates = (templates): TemplateValidations[] =>
  templates.map(
    (relevantTemplate) => new TemplateValidations(iGetTemplateValidations(relevantTemplate)),
  );

export const getTemplateValidations = (state, id: string): TemplateValidations[] => {
  const relevantOptions = iGetRelevantTemplateSelectors(state, id);
  const { userTemplateName, flavor, os, workload } = relevantOptions;

  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  if (userTemplateName || (flavor && os && workload)) {
    // all information is filled to select a final template
    const relevantTemplate = iGetRelevantTemplate(
      iUserTemplates,
      iCommonTemplates,
      relevantOptions,
    );
    return getValidationsFromTemplates(relevantTemplate ? [relevantTemplate] : []);
  }

  const relevantTemplates = iGetRelevantTemplates(
    iUserTemplates,
    iCommonTemplates,
    relevantOptions,
  );

  return getValidationsFromTemplates(relevantTemplates.toArray());
};

export const getTemplateValidation = (state, id: string): TemplateValidations => {
  const templateValidations = getTemplateValidations(state, id);
  if (templateValidations && templateValidations.length > 0) {
    return templateValidations[0];
  }

  return null;
};
