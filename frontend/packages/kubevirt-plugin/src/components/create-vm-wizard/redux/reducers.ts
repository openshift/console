import * as _ from 'lodash';
import { fromJS, Map as ImmutableMap } from 'immutable';
import { ImportProvidersField, VMWizardTab } from '../types';
import { iGet } from '../../../utils/immutable';
import { DeviceType } from '../../../constants/vm';
import { InternalActionType, WizardInternalAction } from './types';

const sequentializeBootOrderIndexes = (state, dialogId: string) => {
  const bootOrderIndexes = [
    ...state
      .getIn([dialogId, 'tabs', VMWizardTab.NETWORKING, 'value'])
      .toArray()
      .map((network) => network.getIn(['networkInterface', 'bootOrder'])),
    ...state
      .getIn([dialogId, 'tabs', VMWizardTab.STORAGE, 'value'])
      .toArray()
      .map((storage) => storage.getIn(['disk', 'bootOrder'])),
  ]
    .filter((bootOrder) => bootOrder != null)
    .sort((a, b) => a - b);

  return [DeviceType.NIC, DeviceType.DISK].reduce((newState, deviceType) => {
    const tab = deviceType === DeviceType.DISK ? VMWizardTab.STORAGE : VMWizardTab.NETWORKING;
    const deviceName = deviceType === DeviceType.DISK ? 'disk' : 'networkInterface';

    return newState.updateIn([dialogId, 'tabs', tab, 'value'], (deviceWrappers) => {
      return deviceWrappers.map((deviceWrapper) => {
        const oldBootOrder = deviceWrapper.getIn([deviceName, 'bootOrder']);

        if (oldBootOrder != null) {
          const newBootOrder = bootOrderIndexes.indexOf(oldBootOrder) + 1;
          if (newBootOrder !== oldBootOrder) {
            return deviceWrapper.setIn([deviceName, 'bootOrder'], newBootOrder);
          }
        }
        return deviceWrapper;
      });
    });
  }, state);
};

const setDeviceBootOrder = (
  state,
  dialogId: string,
  deviceID: string,
  updatedDeviceType: DeviceType,
  updatedDeviceBootOrder: number,
) => {
  const resultState = [DeviceType.NIC, DeviceType.DISK].reduce((newState, devType) => {
    const tab = devType === DeviceType.DISK ? VMWizardTab.STORAGE : VMWizardTab.NETWORKING;
    const deviceName = devType === DeviceType.DISK ? 'disk' : 'networkInterface';

    return newState.updateIn([dialogId, 'tabs', tab, 'value'], (deviceWrappers) => {
      return deviceWrappers.map((deviceWrapper) => {
        const wrapperID = deviceWrapper.get('id');
        const oldBootOrder = deviceWrapper.getIn([deviceName, 'bootOrder']);
        const isUpdatedDevice = updatedDeviceType === devType && wrapperID === deviceID;
        if (isUpdatedDevice || (oldBootOrder != null && updatedDeviceBootOrder <= oldBootOrder)) {
          return deviceWrapper.setIn(
            [deviceName, 'bootOrder'],
            isUpdatedDevice ? updatedDeviceBootOrder : oldBootOrder + 1,
          );
        }
        return deviceWrapper;
      });
    });
  }, state);

  return sequentializeBootOrderIndexes(resultState, dialogId);
};

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
    const networkIndex = itemID != null ? items.findIndex((t) => iGet(t, 'id') === itemID) : -1;
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
  const dialogID = payload && payload.id;

  switch (action.type) {
    case InternalActionType.Create:
      return state.set(dialogID, fromJS(payload.value));
    case InternalActionType.Dispose:
      return state.delete(dialogID);
    case InternalActionType.UpdateNIC:
      return updateIDItemInList(
        state,
        [dialogID, 'tabs', VMWizardTab.NETWORKING, 'value'],
        fromJS(payload.network),
      );
    case InternalActionType.RemoveNIC:
      return removeIDItemFromList(
        state,
        [dialogID, 'tabs', VMWizardTab.NETWORKING, 'value'],
        payload.networkID,
      );
    case InternalActionType.UpdateStorage:
      return updateIDItemInList(
        state,
        [dialogID, 'tabs', VMWizardTab.STORAGE, 'value'],
        fromJS(payload.storage),
      );
    case InternalActionType.RemoveStorage:
      return removeIDItemFromList(
        state,
        [dialogID, 'tabs', VMWizardTab.STORAGE, 'value'],
        payload.storageID,
      );
    case InternalActionType.SetDeviceBootOrder:
      return setDeviceBootOrder(
        state,
        dialogID,
        payload.deviceID,
        payload.deviceType,
        payload.bootOrder,
      );
    case InternalActionType.SetNetworks:
      return setTabKeys(state, VMWizardTab.NETWORKING, action);
    case InternalActionType.SetStorages:
      return setTabKeys(state, VMWizardTab.STORAGE, action);
    case InternalActionType.SetResults:
      return setTabKeys(state, VMWizardTab.RESULT, action);
    case InternalActionType.Update:
      return mergeDeepInSpecial(state, [dialogID], fromJS(payload.value));
    case InternalActionType.UpdateCommonData:
      return setObjectValues(
        setObjectValues(state, [dialogID, 'commonData', 'data'], payload.value.data),
        [dialogID, 'commonData', 'dataIDReferences'],
        payload.value.dataIDReferences,
      );
    case InternalActionType.SetExtraWSQueries:
      return state.setIn([dialogID, 'extraWSQueries', payload.queryKey], fromJS(payload.wsQueries));
    case InternalActionType.SetTabValidity:
      return state
        .setIn([dialogID, 'tabs', payload.tab, 'isValid'], payload.isValid)
        .setIn(
          [dialogID, 'tabs', payload.tab, 'hasAllRequiredFilled'],
          payload.hasAllRequiredFilled,
        )
        .setIn([dialogID, 'tabs', payload.tab, 'error'], payload.error);
    case InternalActionType.SetTabLocked:
      return state.setIn([dialogID, 'tabs', payload.tab, 'isLocked'], payload.isLocked);
    case InternalActionType.SetTabHidden:
      return state.setIn([dialogID, 'tabs', payload.tab, 'isHidden'], payload.isHidden);
    case InternalActionType.SetVmSettingsFieldValue:
      return state.setIn(
        [dialogID, 'tabs', VMWizardTab.VM_SETTINGS, 'value', payload.key, 'value'],
        fromJS(payload.value),
      );
    case InternalActionType.SetImportProvidersFieldValue:
      return state.setIn(
        [dialogID, 'tabs', VMWizardTab.IMPORT_PROVIDERS, 'value', payload.key, 'value'],
        fromJS(payload.value),
      );
    case InternalActionType.UpdateImportProviderField:
      return mergeDeepInSpecial(
        state,
        [
          dialogID,
          'tabs',
          VMWizardTab.IMPORT_PROVIDERS,
          'value',
          ImportProvidersField.PROVIDERS_DATA,
          payload.provider,
          payload.key,
        ],
        fromJS(payload.value),
      );
    case InternalActionType.UpdateImportProvider:
      return mergeDeepInSpecial(
        state,
        [
          dialogID,
          'tabs',
          VMWizardTab.IMPORT_PROVIDERS,
          'value',
          ImportProvidersField.PROVIDERS_DATA,
          payload.provider,
        ],
        fromJS(payload.value),
      );
    case InternalActionType.SetCloudInitFieldValue:
      return state.setIn(
        [dialogID, 'tabs', VMWizardTab.ADVANCED_CLOUD_INIT, 'value', payload.key, 'value'],
        fromJS(payload.value),
      );
    case InternalActionType.SetInVmSettings:
      return state.setIn(
        [dialogID, 'tabs', VMWizardTab.VM_SETTINGS, 'value', ...payload.path],
        fromJS(payload.value),
      );
    case InternalActionType.SetInVmSettingsBatch:
      return payload.batch.reduce(
        (nextState, { path, value }) =>
          nextState.setIn(
            [dialogID, 'tabs', VMWizardTab.VM_SETTINGS, 'value', ...path],
            fromJS(value),
          ),
        state,
      );
    case InternalActionType.UpdateVmSettingsField:
      return mergeDeepInSpecial(
        state,
        [dialogID, 'tabs', VMWizardTab.VM_SETTINGS, 'value', payload.key],
        fromJS(payload.value),
      );
    case InternalActionType.UpdateVmSettings:
      return mergeDeepInSpecial(
        state,
        [dialogID, 'tabs', VMWizardTab.VM_SETTINGS, 'value'],
        fromJS(payload.value),
      );
    default:
      break;
  }
  return state;
};
