import { CommonData, VMWizardTab } from '../../types';
import { getVmSettingsInitialState } from './vm-settings-tab-initial-state';
import { getNetworksInitialState } from './networks-tab-initial-state';
import { getStorageInitialState } from './storage-tab-initial-state';
import { getResultInitialState } from './result-tab-initial-state';
import { getReviewInitialState } from './review-tab-initial-state';
import { getCloudInitInitialState } from './cloud-init-tab-initial-state';

const initialStateGetterResolver = {
  [VMWizardTab.VM_SETTINGS]: getVmSettingsInitialState,
  [VMWizardTab.NETWORKING]: getNetworksInitialState,
  [VMWizardTab.STORAGE]: getStorageInitialState,
  [VMWizardTab.ADVANCED_CLOUD_INIT]: getCloudInitInitialState,
  [VMWizardTab.REVIEW]: getReviewInitialState,
  [VMWizardTab.RESULT]: getResultInitialState,
};

export const getTabInitialState = (tabKey: VMWizardTab, props: CommonData) => {
  const getter = initialStateGetterResolver[tabKey];

  let result;
  if (getter) {
    result = getter(props);
  }

  return (
    result || {
      value: {},
      error: null,
      isValid: false,
      isLocked: false,
      hasAllRequiredFilled: false,
    }
  );
};
