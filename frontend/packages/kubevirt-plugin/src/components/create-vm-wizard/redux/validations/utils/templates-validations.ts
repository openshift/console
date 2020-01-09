import { UpdateOptions } from '../../types';
import {
  iGetVmSettingAttribute,
  iGetVmSettingValue,
} from '../../../selectors/immutable/vm-settings';
import { iGetLoadedCommonData } from '../../../selectors/immutable/selectors';
import { VMSettingsField, VMWizardProps } from '../../../types';
import { iGetTemplateValidations } from '../../../../../selectors/immutable/template/selectors';
import { iGetRelevantTemplates } from '../../../../../selectors/immutable/template/combined';
import { TemplateValidations } from '../../../../../utils/validations/template/template-validations';

const getValidationsFromTemplates = (templates): TemplateValidations[] =>
  templates.map(
    (relevantTemplate) => new TemplateValidations(iGetTemplateValidations(relevantTemplate)),
  );

export const getTemplateValidations = (options: UpdateOptions): TemplateValidations[] => {
  const { getState, id } = options;
  const state = getState();

  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);
  const os = iGetVmSettingAttribute(state, id, VMSettingsField.OPERATING_SYSTEM);
  const flavor = iGetVmSettingAttribute(state, id, VMSettingsField.FLAVOR);
  const workload = iGetVmSettingAttribute(state, id, VMSettingsField.WORKLOAD_PROFILE);

  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

  const templates = iGetRelevantTemplates(iUserTemplates, iCommonTemplates, {
    userTemplateName,
    os,
    workload,
    flavor,
  });

  if (templates.size > 0 && os && workload) {
    // templates are sorted by relevance if only flavor is missing
    return getValidationsFromTemplates([templates.first()]);
  }

  return getValidationsFromTemplates(templates.toArray());
};
