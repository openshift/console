import * as _ from 'lodash';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { VMWizardTab } from '../types';
import { iGet } from '../../../utils/immutable';
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

const TAB_UPDATE_KEYS = ['value', 'isValid', 'isLocked', 'isPending', 'hasAllRequiredFilled'];

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

const updateIDItemInList = (state, path, item?) => {
  const itemID = iGet(item, 'id');
  return state.updateIn(path, (items) => {
    const networkIndex = item ? items.findIndex((t) => iGet(t, 'id') === itemID) : -1;
    if (networkIndex === -1) {
      const maxID = items.map((t) => iGet(t, 'id')).max() || 0;
      return items.push(item.set('id', _.toString(_.toSafeInteger(maxID) + 1)));
    }
    return items.set(networkIndex, item);
  });
};

const removeIDItemFromList = (state, path, itemID?) => {
  return state.updateIn(path, (items) => {
    const networkIndex = itemID == null ? -1 : items.findIndex((t) => iGet(t, 'id') === itemID);
    return networkIndex === -1 ? items : items.delete(networkIndex);
  });
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
    case InternalActionType.UpdateNIC:
      return updateIDItemInList(
        state,
        [dialogId, 'tabs', VMWizardTab.NETWORKING, 'value'],
        fromJS(payload.network),
      );
    case InternalActionType.RemoveNIC:
      return removeIDItemFromList(
        state,
        [dialogId, 'tabs', VMWizardTab.NETWORKING, 'value'],
        payload.networkID,
      );
    case InternalActionType.SetNetworks:
      return setTabKeys(state, VMWizardTab.NETWORKING, action);
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
      return state
        .setIn([dialogId, 'tabs', payload.tab, 'isValid'], payload.isValid)
        .setIn(
          [dialogId, 'tabs', payload.tab, 'hasAllRequiredFilled'],
          payload.hasAllRequiredFilled,
        );
    case InternalActionType.SetTabLocked:
      return state.setIn([dialogId, 'tabs', payload.tab, 'isLocked'], payload.isLocked);
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
