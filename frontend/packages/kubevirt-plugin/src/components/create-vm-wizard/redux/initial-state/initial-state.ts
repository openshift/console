import * as _ from 'lodash';
import { CommonData, VMWizardTab, VMWizardTabState } from '../../types';
import { getVmSettingsInitialState } from './vm-settings-tab-initial-state';
import { getNetworksInitialState } from './networks-tab-initial-state';
import { getStorageInitialState } from './storage-tab-initial-state';
import { getResultInitialState } from './result-tab-initial-state';
import { getReviewInitialState } from './review-tab-initial-state';
import { getCloudInitInitialState } from './cloud-init-tab-initial-state';
import { InitialStepStateGetter } from './types';
import { getImportProvidersInitialState } from './import-provider-tab-initial-state';

const tabStateChecks = [
  // Any change here must be reflected in getStepsMetadata in wizard-selectors.ts (fields which cannot be serialized)
  { key: 'value', typeCheck: _.isObject, typeName: 'object' },
  { key: 'error', typeCheck: _.isString, typeName: 'string' },
  { key: 'isValid', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'isLocked', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'hasAllRequiredFilled', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'isHidden', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'isPending', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'isCreateDisabled', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'isUpdateDisabled', typeCheck: _.isBoolean, typeName: 'boolean' },
  { key: 'isDeleteDisabled', typeCheck: _.isBoolean, typeName: 'boolean' },
];

const tabStateKeys = new Set(tabStateChecks.map((value) => value.key));

const assertStateKeys = (tabKey: VMWizardTab, state: VMWizardTabState) => {
  tabStateChecks.forEach(({ key, typeCheck, typeName }) => {
    const value = state[key];
    if (value != null && !typeCheck(value)) {
      throw new Error(`${key} must be of ${typeName} type in ${tabKey} tab initial state`);
    }
  });
  Object.keys(state).forEach((key) => {
    if (!tabStateKeys.has(key)) {
      throw new Error(`${key} is not a supported initial state`);
    }
  });
};

const initialStateGetterResolver: { [key in VMWizardTab]: InitialStepStateGetter } = {
  [VMWizardTab.IMPORT_PROVIDERS]: getImportProvidersInitialState,
  [VMWizardTab.VM_SETTINGS]: getVmSettingsInitialState,
  [VMWizardTab.NETWORKING]: getNetworksInitialState,
  [VMWizardTab.STORAGE]: getStorageInitialState,
  [VMWizardTab.ADVANCED_CLOUD_INIT]: getCloudInitInitialState,
  [VMWizardTab.REVIEW]: getReviewInitialState,
  [VMWizardTab.RESULT]: getResultInitialState,
};

export const getTabInitialState = (tabKey: VMWizardTab, data: CommonData): VMWizardTabState => {
  const getter = initialStateGetterResolver[tabKey];

  let tabState: VMWizardTabState;
  if (getter) {
    tabState = getter(data);
  }

  if (!tabState || !_.isObject(tabState)) {
    // default state
    tabState = {
      value: {},
      error: null,
      isPending: null,
      isValid: false,
      isLocked: false,
      hasAllRequiredFilled: false,
      isHidden: false,
      isCreateDisabled: false,
      isUpdateDisabled: false,
      isDeleteDisabled: false,
    };
  }

  assertStateKeys(tabKey, tabState);

  return tabState;
};
