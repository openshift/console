import { VMWizardTab } from '../types';
import { getProviders } from '../provider-definitions';
import { UpdateOptions } from './types';
import { updateVmSettingsState } from './stateUpdate/vmSettings/vm-settings-tab-state-update';
import { updateStorageTabState } from './stateUpdate/vmSettings/storage-tab-state-update';
import {
  setVmSettingsTabValidity,
  validateVmSettings,
} from './validations/vm-settings-tab-validation';
import { setNetworksTabValidity, validateNetworks } from './validations/networks-tab-validation';
import { setStoragesTabValidity, validateStorages } from './validations/storage-tab-validation';

const UPDATE_TABS = [VMWizardTab.VM_SETTINGS, VMWizardTab.NETWORKING, VMWizardTab.STORAGE];

const updaterResolver = {
  [VMWizardTab.VM_SETTINGS]: updateVmSettingsState,
  [VMWizardTab.STORAGE]: updateStorageTabState,
};

const validateTabResolver = {
  [VMWizardTab.VM_SETTINGS]: validateVmSettings,
  [VMWizardTab.NETWORKING]: validateNetworks,
  [VMWizardTab.STORAGE]: validateStorages,
};

const isTabValidResolver = {
  [VMWizardTab.VM_SETTINGS]: setVmSettingsTabValidity,
  [VMWizardTab.NETWORKING]: setNetworksTabValidity,
  [VMWizardTab.STORAGE]: setStoragesTabValidity,
};

export const updateAndValidateState = (options: UpdateOptions) => {
  const { prevState, changedCommonData, getState } = options;

  UPDATE_TABS.forEach((tabKey) => {
    const updater = updaterResolver[tabKey];
    updater && updater(options);
  });

  if (changedCommonData.size > 0 || prevState !== getState()) {
    UPDATE_TABS.forEach((tabKey) => {
      const dataValidator = validateTabResolver[tabKey];
      const tabValidator = isTabValidResolver[tabKey];

      if (dataValidator) {
        dataValidator(options);
      }

      if (tabValidator) {
        tabValidator(options);
      }
    });
  }
};

export const cleanup = (options: UpdateOptions) => {
  getProviders().forEach((provider) => provider.cleanup(options));
};
