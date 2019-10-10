import { VMWizardTab } from '../types';
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

  const propsChanged = Object.keys(changedCommonData).some((key) => changedCommonData[key]);
  const enhancedOptions = { ...options, propsChanged };

  UPDATE_TABS.forEach((tabKey) => {
    const updater = updaterResolver[tabKey];
    updater && updater(enhancedOptions);
  });

  if (propsChanged || prevState !== getState()) {
    UPDATE_TABS.forEach((tabKey) => {
      const dataValidator = validateTabResolver[tabKey];
      const tabValidator = isTabValidResolver[tabKey];

      if (dataValidator) {
        dataValidator(options);
      }

      if (tabValidator) {
        tabValidator(enhancedOptions);
      }
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cleanup = (options: UpdateOptions) => {
  // TODO (suomiy): add providers
  // getProviders().forEach((provider) => {
  //   cleanupProvider(provider, options);
  // });
};
