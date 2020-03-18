import { CommonData, VMWizardTab } from '../../types';
import { getVmSettingsInitialState } from './vm-settings-tab-initial-state';
import { getNetworksInitialState } from './networks-tab-initial-state';
import { getStorageInitialState } from './storage-tab-initial-state';
import { getResultInitialState } from './result-tab-initial-state';
import { getReviewInitialState } from './review-tab-initial-state';
import { getCloudInitInitialState } from './cloud-init-tab-initial-state';
import { InitialStepStateGetter, StepState } from './types';
import { getVirtualHardwareInitialState } from './virtual-hardware-tab-initial-state';
import { getImportProvidersInitialState } from './import-provider-tab-initial-state';

const initialStateGetterResolver: { [key in VMWizardTab]: InitialStepStateGetter } = {
  [VMWizardTab.IMPORT_PROVIDERS]: getImportProvidersInitialState,
  [VMWizardTab.VM_SETTINGS]: getVmSettingsInitialState,
  [VMWizardTab.NETWORKING]: getNetworksInitialState,
  [VMWizardTab.STORAGE]: getStorageInitialState,
  [VMWizardTab.ADVANCED_CLOUD_INIT]: getCloudInitInitialState,
  [VMWizardTab.ADVANCED_VIRTUAL_HARDWARE]: getVirtualHardwareInitialState,
  [VMWizardTab.REVIEW]: getReviewInitialState,
  [VMWizardTab.RESULT]: getResultInitialState,
};

export const getTabInitialState = (tabKey: VMWizardTab, data: CommonData): StepState => {
  const getter = initialStateGetterResolver[tabKey];

  let result: StepState;
  if (getter) {
    result = getter(data);
  }

  return (
    result || {
      value: {},
      error: null,
      isValid: false,
      isLocked: false,
      hasAllRequiredFilled: false,
      isHidden: false,
    }
  );
};
