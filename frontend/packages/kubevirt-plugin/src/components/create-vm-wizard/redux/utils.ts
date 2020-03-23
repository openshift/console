import { VMWizardTab } from '../types';
import { UpdateOptions } from './types';
import { updateImportProvidersState } from './stateUpdate/vmSettings/import-provider-tab-state-update';
import { updateVmSettingsState } from './stateUpdate/vmSettings/vm-settings-tab-state-update';
import { updateStorageTabState } from './stateUpdate/vmSettings/storage-tab-state-update';
import {
  setVmSettingsTabValidity,
  validateVmSettings,
} from './validations/vm-settings-tab-validation';
import { setNetworksTabValidity, validateNetworks } from './validations/networks-tab-validation';
import { setStoragesTabValidity, validateStorages } from './validations/storage-tab-validation';
import { setVirtualHardwareTabValidity } from './validations/virtual-hardware-tab-validation';
import { setImportProvidersTabValidity } from './validations/import-providers-tab-validation';

const UPDATE_TABS = [
  VMWizardTab.IMPORT_PROVIDERS,
  VMWizardTab.VM_SETTINGS,
  VMWizardTab.NETWORKING,
  VMWizardTab.STORAGE,
  VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
];

const updaterResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: updateImportProvidersState,
  [VMWizardTab.VM_SETTINGS]: updateVmSettingsState,
  [VMWizardTab.STORAGE]: updateStorageTabState,
};

const validateTabResolver = {
  [VMWizardTab.VM_SETTINGS]: validateVmSettings,
  [VMWizardTab.NETWORKING]: validateNetworks,
  [VMWizardTab.STORAGE]: validateStorages,
};

const isTabValidResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: setImportProvidersTabValidity,
  [VMWizardTab.VM_SETTINGS]: setVmSettingsTabValidity,
  [VMWizardTab.NETWORKING]: setNetworksTabValidity,
  [VMWizardTab.STORAGE]: setStoragesTabValidity,
  [VMWizardTab.ADVANCED_VIRTUAL_HARDWARE]: setVirtualHardwareTabValidity,
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
