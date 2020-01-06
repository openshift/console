import { getRelevantTemplates } from '../../../../../selectors/vm-template/selectors';
import { getFieldId } from '../../../utils/vm-settings-tab-utils';
import { UpdateOptions } from '../../types';
import {
  iGetVmSettingAttribute,
  iGetVmSettingValue,
} from '../../../selectors/immutable/vm-settings';
import { iGetLoadedCommonData, iGetName } from '../../../selectors/immutable/selectors';
import { VMSettingsField, VMWizardProps, VMSettingsRenderableField } from '../../../types';
import { iGetIn } from '../../../../../utils/immutable';
import { CommonTemplatesValidation } from './validation-types';
import { getValidationsFromTemplates, getFieldValidations } from './selectors';

// TODO: Add all the fields in the form
// For each field we need to check for validations
const IDToJsonPath = {
  [getFieldId(VMSettingsField.MEMORY)]: '.spec.domain.resources.requests.memory',
  [getFieldId(VMSettingsField.CPU)]: '.spec.domain.cpu.cores',
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

  // Get OS, workload-profile and flavor attributes
  const os = iGetVmSettingAttribute(state, id, VMSettingsField.OPERATING_SYSTEM);
  const flavor = iGetVmSettingAttribute(state, id, VMSettingsField.FLAVOR);
  const workloadProfile = iGetVmSettingAttribute(state, id, VMSettingsField.WORKLOAD_PROFILE);

  // Get all the templates from common-templates
  const commonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  // Get userTemplate if it was chosen
  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);
  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  const iUserTemplate =
    userTemplateName && iUserTemplates
      ? iUserTemplates.find((template) => iGetName(template) === userTemplateName)
      : null;

  // Get all the validations from the relevant templates:
  // Get the validations from the user template, if chosen.
  // If not, get the validations from Common-Templates based on OS, Workload-Profile and Flavor
  const validations = iUserTemplate
    ? JSON.parse(iGetIn(iUserTemplate, ['metadata', 'annotations', 'validations']))
    : getValidationsFromTemplates(
        // Get templates based on OS, Workload-Profile and Flavor
        getRelevantTemplates(commonTemplates, os, workloadProfile, flavor),
      );

  // Return all the validations which are relevant for the field
  return getFieldValidations(validations, IDToJsonPath[fieldId]);
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
