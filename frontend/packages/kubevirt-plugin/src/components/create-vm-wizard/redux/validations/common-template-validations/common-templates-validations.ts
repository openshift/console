import { TemplateKind } from '@console/internal/module/k8s';
import { getRelevantTemplates } from '../../../../../selectors/vm-template/selectors';
import { UpdateOptions } from '../../types';
import {
  iGetVmSettingAttribute,
  iGetVmSettingValue,
} from '../../../selectors/immutable/vm-settings';
import { iGetLoadedCommonData, iGetName } from '../../../selectors/immutable/selectors';
import { VMSettingsField, VMWizardProps, VMSettingsRenderableField } from '../../../types';
import { CommonTemplatesValidation } from './validation-types';
import { getValidationsFromTemplates } from './selectors';

// TODO: Add all the fields in the form
// For each field we need to check for validations
const IDToJsonPath = {
  [VMSettingsField.MEMORY]: 'jsonpath::.spec.domain.resources.requests.memory',
  [VMSettingsField.CPU]: 'jsonpath::.spec.domain.cpu.cores',
};

export const getTemplateValidations = (
  options: UpdateOptions,
  fieldId: VMSettingsRenderableField,
): CommonTemplatesValidation[] => {
  // Proceed if there are no validation for the specific fieldId
  if (!(fieldId in IDToJsonPath)) {
    return [];
  }
  const { getState, id } = options;
  const state = getState();

  // Get userTemplate if it was chosen
  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);
  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  const iUserTemplate =
    userTemplateName && iUserTemplates
      ? iUserTemplates.find((template) => iGetName(template) === userTemplateName)
      : null;

  if (iUserTemplate) {
    return getValidationsFromTemplates([iUserTemplate] as TemplateKind[], IDToJsonPath[fieldId]);
  }

  // Get OS, workload-profile and flavor attributes
  const os = iGetVmSettingAttribute(state, id, VMSettingsField.OPERATING_SYSTEM);
  const flavor = iGetVmSettingAttribute(state, id, VMSettingsField.FLAVOR);
  const workloadProfile = iGetVmSettingAttribute(state, id, VMSettingsField.WORKLOAD_PROFILE);

  // Get all the templates from common-templates
  const commonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates).toArray();

  // Get all the validations from the relevant templates:
  // Get the validations from the user template, if chosen.
  // If not, get the validations from Common-Templates based on OS, Workload-Profile and Flavor
  const templates = getRelevantTemplates(commonTemplates, os, workloadProfile, flavor);
  return getValidationsFromTemplates(templates, IDToJsonPath[fieldId]);
};

export const runValidation = (
  /*
  - Check if at least one validation has passed.
  - Would *NOT* check if all the validations have passed since it may not be possible
    For example:
    If we have two 'between' validations: 2-4 and 6-10 from 2 different templates,
    There is no value that would satisfy both validations.
  */
  validations: CommonTemplatesValidation[],
  value: any,
): { isValid: boolean; errorMsg: string } => {
  let errorMsg = null;
  const isValid = validations.some((validation) => {
    errorMsg = validation.message;
    if ('min' in validation && 'max' in validation) {
      return value <= validation.max && value >= validation.min;
    }
    if ('min' in validation) {
      return value >= validation.min;
    }
    if ('max' in validation) {
      return value <= validation.max;
    }
    return false;
  });

  return { isValid, errorMsg };
};
