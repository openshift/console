import { Map as ImmutableMap, fromJS } from 'immutable';
import { VMWizardTab } from '../types';
import { InternalActionType, WizardInternalAction } from './types';

// Merge deep in without updating the keys with undefined values
const mergeDeepInSpecial = (state, path: string[], value) =>
  state.updateIn(path, (oldValue) => {
    if (oldValue) {
      return oldValue.mergeDeepWith(
        (oldSubValue, newSubValue) =>
          typeof newSubValue === 'undefined' ? oldSubValue : newSubValue,
        value,
      );
    }
    return value;
  });

const TAB_UPDATE_KEYS = ['value', 'valid', 'locked'];

const setTabKeys = (state, tab: VMWizardTab, action: WizardInternalAction) =>
  TAB_UPDATE_KEYS.reduce((nextState, key) => {
    if (typeof action.payload[key] === 'undefined') {
      return nextState;
    }
    return nextState.setIn([action.payload.id, 'tabs', tab, key], fromJS(action.payload[key]));
  }, state);

const setObjectValues = (state, path, obj) => {
  return obj
    ? Object.keys(obj).reduce(
        (nextState, key) => nextState.setIn([...path, key], fromJS(obj[key])),
        state,
      )
    : state;
};

export default (state, action: WizardInternalAction) => {
  if (!state) {
    return ImmutableMap();
  }
  const { payload } = action;
  const dialogId = payload && payload.id;

  switch (action.type) {
    case InternalActionType.Create:
      return state.set(dialogId, fromJS(payload.value));
    case InternalActionType.Dispose:
      return state.delete(dialogId);
    case InternalActionType.SetNetworks:
      return setTabKeys(state, VMWizardTab.NETWORKS, action);
    case InternalActionType.SetStorages:
      return setTabKeys(state, VMWizardTab.STORAGE, action);
    case InternalActionType.SetResults:
      return setTabKeys(state, VMWizardTab.RESULT, action);
    case InternalActionType.Update:
      return mergeDeepInSpecial(state, [dialogId], fromJS(payload.value));
    case InternalActionType.UpdateCommonData:
      return setObjectValues(
        setObjectValues(state, [dialogId, 'commonData', 'data'], payload.value.data),
        [dialogId, 'commonData', 'dataIDReferences'],
        payload.value.dataIDReferences,
      );
    case InternalActionType.SetTabValidity:
      return state.setIn([dialogId, 'tabs', payload.tab, 'valid'], payload.valid);
    case InternalActionType.SetVmSettingsFieldValue:
      return state.setIn(
        [dialogId, 'tabs', VMWizardTab.VM_SETTINGS, 'value', payload.key, 'value'],
        fromJS(payload.value),
      );
    case InternalActionType.SetInVmSettings:
      return state.setIn(
        [dialogId, 'tabs', VMWizardTab.VM_SETTINGS, 'value', ...payload.path],
        fromJS(payload.value),
      );
    case InternalActionType.SetInVmSettingsBatch:
      return payload.batch.reduce(
        (nextState, { path, value }) =>
          nextState.setIn(
            [dialogId, 'tabs', VMWizardTab.VM_SETTINGS, 'value', ...path],
            fromJS(value),
          ),
        state,
      );
    case InternalActionType.UpdateVmSettingsField:
      return mergeDeepInSpecial(
        state,
        [dialogId, 'tabs', VMWizardTab.VM_SETTINGS, 'value', payload.key],
        fromJS(payload.value),
      );
    case InternalActionType.UpdateVmSettings:
      return mergeDeepInSpecial(
        state,
        [dialogId, 'tabs', VMWizardTab.VM_SETTINGS, 'value'],
        fromJS(payload.value),
      );
    default:
      break;
  }
  return state;
};
