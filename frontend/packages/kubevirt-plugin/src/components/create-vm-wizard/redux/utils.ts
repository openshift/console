import { VMWizardTab } from '../types';
import { finalizeImportProviderStateUpdate } from './finalize-state-update/import-provider-finalize-state-update';
import { updateAdvancedTabState } from './state-update/advanced-tab-state-update';
import { updateImportProvidersState } from './state-update/import-provider-tab-state-update';
import { updateStorageTabState } from './state-update/storage-tab-state-update';
import { updateVmSettingsState } from './state-update/vm-settings-tab-state-update';
import { UpdateOptions } from './types';
import {
  setImportProvidersTabValidity,
  validateImportProviderTab,
} from './validations/import-providers-tab-validation';
import { setNetworksTabValidity, validateNetworks } from './validations/networks-tab-validation';
import { setStoragesTabValidity, validateStorages } from './validations/storage-tab-validation';
import {
  setVmSettingsTabValidity,
  validateVmSettings,
} from './validations/vm-settings-tab-validation';

const UPDATE_TABS = [
  VMWizardTab.IMPORT_PROVIDERS,
  VMWizardTab.VM_SETTINGS,
  VMWizardTab.NETWORKING,
  VMWizardTab.STORAGE,
  VMWizardTab.ADVANCED,
];

const updaterResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: updateImportProvidersState,
  [VMWizardTab.VM_SETTINGS]: updateVmSettingsState,
  [VMWizardTab.STORAGE]: updateStorageTabState,
  [VMWizardTab.ADVANCED]: updateAdvancedTabState,
};

const validateTabResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: validateImportProviderTab,
  [VMWizardTab.VM_SETTINGS]: validateVmSettings,
  [VMWizardTab.NETWORKING]: validateNetworks,
  [VMWizardTab.STORAGE]: validateStorages,
};

const isTabValidResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: setImportProvidersTabValidity,
  [VMWizardTab.VM_SETTINGS]: setVmSettingsTabValidity,
  [VMWizardTab.NETWORKING]: setNetworksTabValidity,
  [VMWizardTab.STORAGE]: setStoragesTabValidity,
};

const finalizeTabResolver = {
  [VMWizardTab.IMPORT_PROVIDERS]: finalizeImportProviderStateUpdate,
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

  UPDATE_TABS.forEach((tabKey) => {
    const finalizer = finalizeTabResolver[tabKey];
    finalizer && finalizer(options);
  });
};
