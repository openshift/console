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
  const { flavor, os, workload } = relevantOptions;

  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  if (iUserTemplate || (flavor && os && workload)) {
    // all information is filled to select a final template
    const relevantTemplate =
      iUserTemplate || iGetRelevantTemplate(iCommonTemplates, relevantOptions);
    return getValidationsFromTemplates(relevantTemplate ? [relevantTemplate] : []);
  }

  const relevantTemplates = iGetRelevantTemplates(iCommonTemplates, relevantOptions);

  return getValidationsFromTemplates(relevantTemplates.toArray());
};

export const getTemplateValidation = (state, id: string): TemplateValidations => {
  const templateValidations = getTemplateValidations(state, id);
  if (templateValidations && templateValidations.length > 0) {
    return templateValidations[0];
  }

  return null;
};
