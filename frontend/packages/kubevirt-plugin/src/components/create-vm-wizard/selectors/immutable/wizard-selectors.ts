import { iGet, iGetIn } from '../../../../utils/immutable';
import { VMSettingsField, VMWizardNetworkType, VMWizardTab } from '../../types';
import { getStringEnumValues } from '../../../../utils/types';
import { CUSTOM_FLAVOR } from '../../../../constants/vm';

export const isStepValid = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'isValid']);
export const isStepLocked = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'isLocked']);
export const isStepPending = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'isPending']);
export const hasStepAllRequiredFilled = (stepData, stepId: VMWizardTab) =>
  !!iGetIn(stepData, [stepId, 'hasAllRequiredFilled']);
export const getStepError = (stepData, stepId: VMWizardTab) => iGetIn(stepData, [stepId, 'error']);

export const isLastStepErrorFatal = (stepData) =>
  iGetIn(stepData, [VMWizardTab.RESULT, 'value', 'isFatal']);

export const isWizardEmpty = (stepData, isProviderImport) => {
  const networks = iGetIn(stepData, [VMWizardTab.NETWORKING, 'value']);
  const isNetworkEmpty =
    networks.isEmpty() ||
    (networks.size === 1 &&
      iGet(networks.get(0), 'type') === VMWizardNetworkType.UI_DEFAULT_POD_NETWORK);

  if (!isNetworkEmpty || !iGetIn(stepData, [VMWizardTab.STORAGE, 'value']).isEmpty()) {
    return false;
  }

  const fields = new Set(getStringEnumValues<VMSettingsField>(VMSettingsField));

  if (isProviderImport) {
    fields.delete(VMSettingsField.PROVISION_SOURCE_TYPE);
  }

  // providers data do not need to be checked because the change is detected through selection of provider
  fields.delete(VMSettingsField.PROVIDERS_DATA);

  return ![...fields].some((fieldKey) => {
    const value = iGetIn(stepData, [VMWizardTab.VM_SETTINGS, 'value', fieldKey, 'value']);
    return fieldKey === VMSettingsField.FLAVOR && value === CUSTOM_FLAVOR ? null : value;
  });
};
