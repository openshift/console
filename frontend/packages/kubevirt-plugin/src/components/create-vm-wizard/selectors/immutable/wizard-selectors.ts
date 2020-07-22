import { iGet, iGetIn } from '../../../../utils/immutable';
import {
  ImportProvidersField,
  VMSettingsField,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardTab,
  VMWizardTabsMetadata,
  ALL_VM_WIZARD_TABS,
} from '../../types';
import { getStringEnumValues } from '../../../../utils/types';
import { iGetCreateVMWizardTabs } from './common';
import { iGetCommonData } from './selectors';
import { isCustomFlavor } from '../../../../selectors/vm-like/flavor';

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

export const isLastStepErrorFatal = (state, wizardID: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, wizardID), [VMWizardTab.RESULT, 'value', 'isFatal']);

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

  const isProviderImport = iGetCommonData(state, wizardID, VMWizardProps.isProviderImport);
  const isSimpleView = iGetCommonData(state, wizardID, VMWizardProps.isSimpleView);

  const visibleTabls = ALL_VM_WIZARD_TABS.filter((tab) => !result[tab].isHidden);
  const disableJumpToAll =
    result[VMWizardTab.RESULT].isLocked ||
    result[VMWizardTab.RESULT].isValid ||
    result[VMWizardTab.RESULT].isPending;
  const isLocked = visibleTabls.some((tab) => result[tab]?.isLocked);
  const lastTabErrorFatal = isLastStepErrorFatal(state, wizardID);

  // Can jump if form is not loacked, disabled or in fatal error state
  result[visibleTabls[0]].canJumpTo = !disableJumpToAll && !isLocked && !lastTabErrorFatal;

  // Can jump is previous tab is valid and can jump to
  // Import Wizard tabs should be navigable even when previous is not valid
  for (let i = 1; i < visibleTabls.length; i++) {
    const prev = result[visibleTabls[i - 1]];
    const isPrevStepValid =
      isSimpleView && isProviderImport
        ? result[VMWizardTab.IMPORT_PROVIDERS].isValid
        : prev?.isValid;

    result[visibleTabls[i]].canJumpTo =
      !disableJumpToAll && !isLocked && !lastTabErrorFatal && prev?.canJumpTo && isPrevStepValid;
  }

  // Result tab is a special case
  result[VMWizardTab.RESULT].canJumpTo =
   (lastTabErrorFatal || result[VMWizardTab.RESULT].isValid != null) && !isLocked;

  return result;
};

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
    return fieldKey === VMSettingsField.FLAVOR && isCustomFlavor(value) ? null : value;
  });
};
