import { iGet, iGetIn } from '../../../../utils/immutable';
import {
  ImportProvidersField,
  VMSettingsField,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardTab,
  VMWizardTabsMetadata,
} from '../../types';
import { getStringEnumValues } from '../../../../utils/types';
import { CUSTOM_FLAVOR } from '../../../../constants/vm/constants';
import { iGetCreateVMWizardTabs } from './common';
import { iGetCommonData } from './selectors';

const getTabBoolean = (state, wizardID: string, stepId: VMWizardTab, key) =>
  !!iGetIn(iGetCreateVMWizardTabs(state, wizardID), [stepId, key]);

export const isStepValid = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isValid');

export const isStepLocked = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isLocked');

export const isStepPending = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isPending');

export const isStepHidden = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isHidden');

export const hasStepCreateDisabled = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isCreateDisabled');

export const hasStepUpdateDisabled = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isUpdateDisabled');

export const hasStepDeleteDisabled = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'isDeleteDisabled');

export const hasStepAllRequiredFilled = (state, wizardID: string, stepId: VMWizardTab) =>
  getTabBoolean(state, wizardID, stepId, 'hasAllRequiredFilled');

export const getStepError = (state, wizardID: string, stepId: VMWizardTab) =>
  iGetIn(iGetCreateVMWizardTabs(state, wizardID), [stepId, 'error']);

export const getStepsMetadata = (state, wizardID: string): VMWizardTabsMetadata => {
  const stepData = iGetCreateVMWizardTabs(state, wizardID);
  if (!stepData) {
    return {} as VMWizardTabsMetadata;
  }

  const result = stepData.toObject();

  Object.keys(result).forEach((tab) => {
    result[tab] = result[tab].toObject();
    delete result[tab].value;
  });

  return result;
};

export const isLastStepErrorFatal = (state, wizardID: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, wizardID), [VMWizardTab.RESULT, 'value', 'isFatal']);

export const isWizardEmpty = (state, wizardID: string) => {
  const stepData = iGetCreateVMWizardTabs(state, wizardID);
  const isProviderImport = iGetCommonData(state, wizardID, VMWizardProps.isProviderImport);

  if (isProviderImport) {
    return !iGetIn(stepData, [
      VMWizardTab.IMPORT_PROVIDERS,
      'value',
      ImportProvidersField.PROVIDER,
      'value',
    ]);
  }

  const networks = iGetIn(stepData, [VMWizardTab.NETWORKING, 'value']);
  const isNetworkEmpty =
    networks.isEmpty() ||
    (networks.size === 1 &&
      iGet(networks.get(0), 'type') === VMWizardNetworkType.UI_DEFAULT_POD_NETWORK);

  if (!isNetworkEmpty || !iGetIn(stepData, [VMWizardTab.STORAGE, 'value']).isEmpty()) {
    return false;
  }

  const fields = new Set(getStringEnumValues<VMSettingsField>(VMSettingsField));

  return ![...fields].some((fieldKey) => {
    const value = iGetIn(stepData, [VMWizardTab.VM_SETTINGS, 'value', fieldKey, 'value']);
    return fieldKey === VMSettingsField.FLAVOR && value === CUSTOM_FLAVOR ? null : value;
  });
};
